/**
 * Invoice Service
 * Business logic for invoice generation and management
 */

import type { Invoice } from "@prisma/client";
import { invoiceRepository } from "./invoice.repository";
import { pdfService } from "./pdf.service";
import {
	calculateGST,
	getFiscalYear,
	getStateCode,
	formatCurrency,
} from "./gst.utils";
import {
	generateInvoiceHash,
	generateVerificationQR,
	generatePaymentQR,
} from "./security.utils";
import { generateUniqueInvoiceNumber } from "./invoice-number.generator";
import prisma from "../../config/database";

interface GenerateInvoiceInput {
	orderId: string;
	tenantId?: string;
	generatedBy?: string;
}

/**
 * Invoice Service
 */
export class InvoiceService {
	/**
	 * Generate invoice for an order
	 */
	async generateInvoice(input: GenerateInvoiceInput): Promise<Invoice> {
		const { orderId, tenantId, generatedBy } = input;

		// Check if invoice already exists for this order
		const existingInvoice = await invoiceRepository.findByOrderId(orderId);
		if (existingInvoice) {
			throw new Error("Invoice already exists for this order");
		}

		// Fetch order with all details
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
				user: true,
			},
		});

		if (!order) {
			throw new Error("Order not found");
		}

		// Fetch business configuration
		let businessConfig = await prisma.businessConfig.findFirst({
			where: tenantId ? { tenantId } : {},
		});

		// If no business config, create default one
		if (!businessConfig) {
			businessConfig = await this.createDefaultBusinessConfig(tenantId);
		}

		// Generate invoice number
		const invoiceNumber = await generateUniqueInvoiceNumber(
			businessConfig.invoicePrefix,
			tenantId,
		);

		// Get fiscal year
		const fiscalYear = getFiscalYear();

		// Extract addresses
		const billingAddress = order.billingAddress as any;
		const shippingAddress = order.shippingAddress as any;

		// Determine seller and buyer states
		const sellerState = (businessConfig.registeredAddress as any).state;
		const buyerState = billingAddress?.state || shippingAddress?.state;

		// Calculate GST
		const gstCalculation = calculateGST({
			subtotal: order.subtotal,
			discount: order.discount,
			shippingCharge: order.shippingCharge,
			codCharge: order.paymentMethod === "COD" ? 50 : 0, // Example COD charge
			gstRate: 18, // 18% for bags
			sellerState,
			buyerState,
		});

		// Prepare HSN codes (assuming all products have HSN 4202 for bags/handbags)
		const itemsHSN = order.items.map((item) => ({
			sku: item.product.sku || item.productId,
			hsnCode: "4202", // HSN for bags/handbags
			taxRate: 18,
		}));

		// Create invoice record
		const invoice = await invoiceRepository.create({
			invoiceNumber,
			invoiceVersion: "1.0",
			order: {
				connect: { id: orderId },
			},
			tenant: tenantId ? { connect: { id: tenantId } } : undefined,
			invoiceDate: new Date(),
			fiscalYear,
			subtotal: order.subtotal,
			discount: order.discount,
			taxableAmount: gstCalculation.taxableAmount,
			cgst: gstCalculation.cgst,
			sgst: gstCalculation.sgst,
			igst: gstCalculation.igst,
			gstRate: 18,
			shippingCharge: order.shippingCharge,
			codCharge: order.paymentMethod === "COD" ? 50 : 0,
			roundingAdjustment: gstCalculation.roundingAdjustment,
			grandTotal: gstCalculation.grandTotal,
			gstType: gstCalculation.gstType,
			placeOfSupply: buyerState,
			sellerGSTIN: businessConfig.gstin,
			sellerPAN: businessConfig.pan,
			sellerCIN: businessConfig.cin,
			itemsHSN,
			paymentMethod: order.paymentMethod,
			paymentStatus: order.paymentStatus,
			paymentDate: order.status === "COMPLETED" ? new Date() : null,
			paymentTransactionId: order.razorpayPaymentId,
			paymentGateway: order.paymentMethod === "RAZORPAY" ? "Razorpay" : null,
			courierName: null,
			trackingNumber: order.trackingNumber,
			estimatedDelivery: order.estimatedDelivery,
			watermark: order.paymentStatus === "COMPLETED" ? "PAID" : "UNPAID",
			copyType: "ORIGINAL",
			templateId: "luxury-v1",
			themeVariant: "LIGHT",
			generatedBy,
		});

		// Generate hash for tamper detection
		const pdfHash = generateInvoiceHash({
			invoiceNumber: invoice.invoiceNumber,
			orderId: invoice.orderId,
			grandTotal: invoice.grandTotal,
			invoiceDate: invoice.invoiceDate,
		});

		// Generate verification QR
		const verificationQR = await generateVerificationQR(invoice.id);

		// Generate payment QR if unpaid
		let paymentQR: string | null = null;
		if (invoice.paymentStatus !== "COMPLETED" && businessConfig.upiId) {
			paymentQR = await generatePaymentQR({
				upiId: businessConfig.upiId,
				amount: invoice.grandTotal,
				invoiceNumber: invoice.invoiceNumber,
				businessName: businessConfig.businessName,
			});
		}

		// Prepare data for PDF template
		const invoiceData = {
			invoiceNumber: invoice.invoiceNumber,
			invoiceVersion: invoice.invoiceVersion,
			orderNumber: order.orderNumber,
			invoiceDate: invoice.invoiceDate,
			fiscalYear: invoice.fiscalYear,
			copyType: invoice.copyType,
			watermark: invoice.watermark,

			// Business details
			businessConfig: {
				businessName: businessConfig.businessName,
				logo: businessConfig.logo,
				phone: businessConfig.phone,
				email: businessConfig.email,
				website: businessConfig.website,
				registeredAddress: businessConfig.registeredAddress,
				authorizedSignatory: businessConfig.authorizedSignatory,
				designation: businessConfig.designation,
				signatureImage: businessConfig.signatureImage,
				returnPolicyDays: businessConfig.returnPolicyDays,
				legalText: businessConfig.legalText,
				jurisdiction: businessConfig.jurisdiction,
			},

			// Tax details
			sellerGSTIN: invoice.sellerGSTIN,
			sellerPAN: invoice.sellerPAN,
			sellerCIN: invoice.sellerCIN,

			// Customer details
			customer: {
				name: order.user.name,
				email: order.user.email,
				phone: order.user.phone,
			},
			billingAddress,
			shippingAddress,

			// Items
			items: order.items.map((item, index) => ({
				name: item.product.name,
				sku: item.product.sku || `PROD-${item.productId}`,
				hsnCode: "4202",
				quantity: item.quantity,
				price: item.price,
				discount: item.discount,
				taxRate: 18,
				subtotal: item.subtotal,
			})),

			// Financial
			subtotal: invoice.subtotal,
			discount: invoice.discount,
			taxableAmount: invoice.taxableAmount,
			cgst: invoice.cgst,
			sgst: invoice.sgst,
			igst: invoice.igst,
			gstRate: invoice.gstRate,
			gstType: invoice.gstType,
			placeOfSupply: invoice.placeOfSupply,
			shippingCharge: invoice.shippingCharge,
			codCharge: invoice.codCharge,
			roundingAdjustment: invoice.roundingAdjustment,
			grandTotal: invoice.grandTotal,

			// Payment
			paymentMethod: invoice.paymentMethod,
			paymentStatus: invoice.paymentStatus,
			paymentDate: invoice.paymentDate,
			paymentTransactionId: invoice.paymentTransactionId,
			paymentGateway: invoice.paymentGateway,

			// Shipping
			courierName: invoice.courierName,
			trackingNumber: invoice.trackingNumber,
			estimatedDelivery: invoice.estimatedDelivery,

			// QR Codes
			verificationQR,
			paymentQR,
		};

		// Generate PDF
		const { buffer, url } = await pdfService.generateAndSave(
			invoiceData,
			invoice.invoiceNumber,
		);

		// Update invoice with PDF details
		const updatedInvoice = await invoiceRepository.update(invoice.id, {
			pdfUrl: url,
			pdfHash,
			pdfGeneratedAt: new Date(),
			verificationQR,
			paymentQR,
		});

		return updatedInvoice;
	}

	/**
	 * Get invoice by ID
	 */
	async getInvoiceById(id: string): Promise<Invoice | null> {
		return invoiceRepository.findById(id);
	}

	/**
	 * Get invoice by invoice number
	 */
	async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
		return invoiceRepository.findByInvoiceNumber(invoiceNumber);
	}

	/**
	 * Get invoice by order ID
	 */
	async getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
		return invoiceRepository.findByOrderId(orderId);
	}

	/**
	 * Verify invoice authenticity
	 */
	async verifyInvoice(invoiceId: string): Promise<{
		isValid: boolean;
		invoice: Invoice | null;
		message: string;
	}> {
		const invoice = await invoiceRepository.findById(invoiceId);

		if (!invoice) {
			return {
				isValid: false,
				invoice: null,
				message: "Invoice not found",
			};
		}

		// Verify hash
		const calculatedHash = generateInvoiceHash({
			invoiceNumber: invoice.invoiceNumber,
			orderId: invoice.orderId,
			grandTotal: invoice.grandTotal,
			invoiceDate: invoice.invoiceDate,
		});

		if (calculatedHash !== invoice.pdfHash) {
			return {
				isValid: false,
				invoice,
				message: "Invoice has been tampered with",
			};
		}

		return {
			isValid: true,
			invoice,
			message: "Invoice is authentic",
		};
	}

	/**
	 * Regenerate invoice PDF
	 */
	async regenerateInvoice(invoiceId: string): Promise<Invoice> {
		const invoice = await invoiceRepository.findById(invoiceId);

		if (!invoice) {
			throw new Error("Invoice not found");
		}

		// Increment regeneration count
		const updatedInvoice = await invoiceRepository.update(invoiceId, {
			regenerationCount: invoice.regenerationCount + 1,
		});

		// Re-generate PDF using existing data
		// (Implementation similar to generateInvoice but using existing invoice data)

		return updatedInvoice;
	}

	/**
	 * List invoices with filters
	 */
	async listInvoices(
		filters: {
			tenantId?: string;
			paymentStatus?: string;
			fiscalYear?: string;
			startDate?: Date;
			endDate?: Date;
		} = {},
		pagination: {
			page?: number;
			limit?: number;
		} = {},
	): Promise<{
		invoices: Invoice[];
		total: number;
		page: number;
		totalPages: number;
	}> {
		const page = pagination.page || 1;
		const limit = pagination.limit || 20;
		const skip = (page - 1) * limit;

		const [invoices, total] = await Promise.all([
			invoiceRepository.findMany(filters, { skip, take: limit }),
			invoiceRepository.count(filters),
		]);

		return {
			invoices,
			total,
			page,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Create default business configuration
	 */
	private async createDefaultBusinessConfig(tenantId?: string) {
		return prisma.businessConfig.create({
			data: {
				tenantId: tenantId || "default",
				businessName: "Bombay Bag House",
				registeredAddress: {
					line1: "Opposite Vanjari Vav",
					line2: "",
					city: "Modasa",
					state: "Gujarat",
					pincode: "383315",
					country: "India",
				},
				phone: "+91 9876543210",
				email: "admin@trivenibombaybaghouse.com",
				website: "https://trivenibombaybaghouse.vercel.app",
				gstin: "24ABCDE1234F1Z5", // Example GSTIN
				pan: "ABCDE1234F",
				stateCode: "24", // Gujarat
				logo: "/assets/logo.png",
				authorizedSignatory: "Proprietor Name",
				designation: "Proprietor",
				jurisdiction: "Gujarat",
				returnPolicyDays: 7,
				invoicePrefix: "TRIVENI-INV",
			},
		});
	}
}

export const invoiceService = new InvoiceService();

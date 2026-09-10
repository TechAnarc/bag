/**
 * Invoice Controller
 * Handles HTTP requests for invoice operations
 */

import type { Request, Response, NextFunction } from "express";
import { invoiceService } from "./invoice.service";
import { z } from "zod";

// Validation schemas
const generateInvoiceSchema = z.object({
	orderId: z.string().uuid(),
	tenantId: z.string().uuid().optional(),
});

const verifyInvoiceSchema = z.object({
	hash: z.string().min(1),
});

/**
 * Generate invoice for an order
 * POST /api/v1/invoices/generate
 */
export async function generateInvoice(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const { orderId, tenantId } = generateInvoiceSchema.parse(req.body);

		const invoice = await invoiceService.generateInvoice({
			orderId,
			tenantId,
			generatedBy: (req as any).auth?.id, // Assuming auth middleware sets req.auth
		});

		res.status(201).json({
			success: true,
			message: "Invoice generated successfully",
			data: {
				invoice,
			},
		});
	} catch (error: any) {
		next(error);
	}
}

/**
 * Get invoice by ID
 * GET /api/v1/invoices/:id
 */
export async function getInvoiceById(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const { id } = req.params;

		const invoice = await invoiceService.getInvoiceById(id as string);

		if (!invoice) {
			res.status(404).json({
				success: false,
				message: "Invoice not found",
			});
			return;
		}

		res.json({
			success: true,
			data: { invoice },
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Get invoice by order ID
 * GET /api/v1/invoices/order/:orderId
 */
export async function getInvoiceByOrderId(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const { orderId } = req.params;

		const invoice = await invoiceService.getInvoiceByOrderId(orderId as string);

		if (!invoice) {
			res.status(404).json({
				success: false,
				message: "No invoice found for this order",
			});
			return;
		}

		res.json({
			success: true,
			data: { invoice },
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Download invoice PDF
 * GET /api/v1/invoices/:id/download
 */
export async function downloadInvoice(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const { id } = req.params;

		const invoice = await invoiceService.getInvoiceById(id as string);

		if (!invoice) {
			res.status(404).json({
				success: false,
				message: "Invoice not found",
			});
			return;
		}

		if (!invoice.pdfUrl) {
			res.status(404).json({
				success: false,
				message: "PDF not generated for this invoice",
			});
			return;
		}

		// Redirect to PDF file or send file directly
		res.redirect(invoice.pdfUrl);
	} catch (error) {
		next(error);
	}
}

/**
 * Verify invoice authenticity
 * GET /api/v1/invoices/verify/:hash
 */
export async function verifyInvoice(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const { hash } = req.params;

		// Find invoice by hash
		const invoice = await invoiceService.getInvoiceById(hash as string);

		if (!invoice) {
			res.status(404).json({
				success: false,
				message: "Invoice not found",
			});
			return;
		}

		const verification = await invoiceService.verifyInvoice(invoice.id);

		res.json({
			success: true,
			data: verification,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * List invoices with filters
 * GET /api/v1/invoices
 */
export async function listInvoices(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const {
			tenantId,
			paymentStatus,
			fiscalYear,
			startDate,
			endDate,
			page,
			limit,
		} = req.query;

		const result = await invoiceService.listInvoices(
			{
				tenantId: tenantId as string | undefined,
				paymentStatus: paymentStatus as string | undefined,
				fiscalYear: fiscalYear as string | undefined,
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
			},
			{
				page: page ? Number.parseInt(page as string) : undefined,
				limit: limit ? Number.parseInt(limit as string) : undefined,
			},
		);

		res.json({
			success: true,
			data: result,
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Regenerate invoice PDF
 * POST /api/v1/invoices/:id/regenerate
 */
export async function regenerateInvoice(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const { id } = req.params;

		const invoice = await invoiceService.regenerateInvoice(id as string);

		res.json({
			success: true,
			message: "Invoice regenerated successfully",
			data: { invoice },
		});
	} catch (error) {
		next(error);
	}
}

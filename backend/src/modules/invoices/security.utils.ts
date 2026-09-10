/**
 * Invoice Security & Hashing Utilities
 * Provides tamper detection and verification capabilities
 */

import crypto from "node:crypto";
import QRCode from "qrcode";

/**
 * Generate SHA-256 hash of invoice data for tamper detection
 */
export function generateInvoiceHash(invoiceData: {
	invoiceNumber: string;
	orderId: string;
	grandTotal: number;
	invoiceDate: Date;
}): string {
	const data = JSON.stringify({
		invoiceNumber: invoiceData.invoiceNumber,
		orderId: invoiceData.orderId,
		grandTotal: invoiceData.grandTotal,
		invoiceDate: invoiceData.invoiceDate.toISOString(),
	});

	return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verify invoice hash
 */
export function verifyInvoiceHash(
	invoiceData: {
		invoiceNumber: string;
		orderId: string;
		grandTotal: number;
		invoiceDate: Date;
	},
	expectedHash: string,
): boolean {
	const actualHash = generateInvoiceHash(invoiceData);
	return actualHash === expectedHash;
}

/**
 * Generate QR code for invoice verification
 */
export async function generateVerificationQR(
	invoiceId: string,
	baseUrl: string = "https://trivenijewellers.com",
): Promise<string> {
	const verificationUrl = `${baseUrl}/verify-invoice/${invoiceId}`;

	try {
		// Generate QR as data URL (base64)
		const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
			errorCorrectionLevel: "H",
			type: "image/png",
			width: 200,
			margin: 1,
			color: {
				dark: "#1A1A1A",
				light: "#FFFFFF",
			},
		});

		return qrDataUrl;
	} catch (error) {
		console.error("Failed to generate verification QR:", error);
		throw new Error("QR generation failed");
	}
}

/**
 * Generate UPI payment QR code
 */
export async function generatePaymentQR(paymentData: {
	upiId: string;
	amount: number;
	invoiceNumber: string;
	businessName: string;
}): Promise<string> {
	// UPI URL format
	const upiUrl = `upi://pay?pa=${paymentData.upiId}&pn=${encodeURIComponent(
		paymentData.businessName,
	)}&am=${paymentData.amount}&tn=${encodeURIComponent(
		`Payment for ${paymentData.invoiceNumber}`,
	)}&cu=INR`;

	try {
		const qrDataUrl = await QRCode.toDataURL(upiUrl, {
			errorCorrectionLevel: "H",
			type: "image/png",
			width: 200,
			margin: 1,
			color: {
				dark: "#1A1A1A",
				light: "#FFFFFF",
			},
		});

		return qrDataUrl;
	} catch (error) {
		console.error("Failed to generate payment QR:", error);
		throw new Error("Payment QR generation failed");
	}
}

/**
 * Generate random secure token
 */
export function generateSecureToken(length: number = 32): string {
	return crypto.randomBytes(length).toString("hex");
}

/**
 * Sign invoice data (simple HMAC signature)
 */
export function signInvoiceData(
	data: string,
	secret: string = process.env.JWT_ACCESS_SECRET || "default-secret",
): string {
	return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify invoice signature
 */
export function verifyInvoiceSignature(
	data: string,
	signature: string,
	secret: string = process.env.JWT_ACCESS_SECRET || "default-secret",
): boolean {
	const expectedSignature = signInvoiceData(data, secret);
	return crypto.timingSafeEqual(
		Buffer.from(signature),
		Buffer.from(expectedSignature),
	);
}

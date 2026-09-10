/**
 * Invoice Number Generator
 * Generates unique invoice numbers in format: BBH-INV-2026-000001
 */

import prisma from "../../config/database";
import { getFiscalYear } from "./gst.utils";

/**
 * Generate next invoice number
 * Format: {PREFIX}-{YEAR}-{SEQUENCE}
 * Example: BBH-INV-2026-000001
 */
export async function generateInvoiceNumber(
	prefix: string = "BBH-INV",
	tenantId?: string,
): Promise<string> {
	const currentYear = new Date().getFullYear();
	const fiscalYear = getFiscalYear();

	// Get the count of invoices for this fiscal year
	const count = await prisma.invoice.count({
		where: {
			fiscalYear,
			...(tenantId && { tenantId }),
		},
	});

	// Next sequence number
	const sequence = count + 1;

	// Zero-pad to 6 digits
	const sequenceStr = sequence.toString().padStart(6, "0");

	// Format: PREFIX-YEAR-SEQUENCE
	return `${prefix}-${currentYear}-${sequenceStr}`;
}

/**
 * Validate invoice number format
 */
export function validateInvoiceNumber(invoiceNumber: string): boolean {
	// Format: PREFIX-YYYY-NNNNNN
	const regex = /^[A-Z]+-[A-Z]+-\d{4}-\d{6}$/;
	return regex.test(invoiceNumber);
}

/**
 * Check if invoice number exists
 */
export async function invoiceNumberExists(
	invoiceNumber: string,
): Promise<boolean> {
	const invoice = await prisma.invoice.findUnique({
		where: { invoiceNumber },
	});
	return !!invoice;
}

/**
 * Generate unique invoice number with retry
 * (In case of concurrent requests causing duplicates)
 */
export async function generateUniqueInvoiceNumber(
	prefix: string = "BBH-INV",
	tenantId?: string,
	maxRetries: number = 5,
): Promise<string> {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		const invoiceNumber = await generateInvoiceNumber(prefix, tenantId);

		const exists = await invoiceNumberExists(invoiceNumber);
		if (!exists) {
			return invoiceNumber;
		}

		// Wait a bit before retrying
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	throw new Error("Failed to generate unique invoice number after retries");
}

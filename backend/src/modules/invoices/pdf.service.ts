/**
 * PDF Generation Service
 * Converts HTML invoice templates to premium PDFs using Puppeteer
 */

import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import fs from "node:fs/promises";
import path from "node:path";

// Register Handlebars helpers
Handlebars.registerHelper("formatDate", (date: Date) => {
	if (!date) return "";
	return new Date(date).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
});

Handlebars.registerHelper("formatAmount", (amount: number) => {
	if (amount === undefined || amount === null) return "0.00";
	return new Intl.NumberFormat("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
});

Handlebars.registerHelper("lowercase", (str: string) => {
	return str?.toLowerCase() || "";
});

Handlebars.registerHelper("add", function (this: any, ...args: any[]) {
	// Remove the handlebars options object (last argument)
	const numbers = args.slice(0, -1);
	return numbers.reduce((sum, num) => sum + (Number(num) || 0), 0);
});

Handlebars.registerHelper("max", function (this: any, ...args: any[]) {
	const numbers = args.slice(0, -1).map((n) => Number(n) || 0);
	return Math.max(...numbers);
});

Handlebars.registerHelper("divide", (a: any, b: any) => {
	return (Number(a) || 0) / (Number(b) || 1);
});

Handlebars.registerHelper("addOne", (index: number) => {
	return index + 1;
});

/**
 * PDF Generation Service
 */
export class PDFGenerationService {
	private browser: Browser | null = null;

	/**
	 * Initialize Puppeteer browser
	 */
	async initialize(): Promise<void> {
		if (!this.browser) {
			this.browser = await puppeteer.launch({
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});
		}
	}

	/**
	 * Close Puppeteer browser
	 */
	async close(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}

	/**
	 * Generate PDF from invoice data
	 */
	async generateInvoicePDF(
		invoiceData: any,
		templateName: string = "luxury-template",
	): Promise<Buffer> {
		try {
			await this.initialize();

			// Load template
			const templatePath = path.join(
				process.cwd(),
				"src",
				"templates",
				"invoices",
				`${templateName}.hbs`,
			);
			const templateContent = await fs.readFile(templatePath, "utf-8");

			// Compile template
			const template = Handlebars.compile(templateContent);

			// Add current year to data
			const dataWithYear = {
				...invoiceData,
				currentYear: new Date().getFullYear(),
			};

			// Render HTML
			const html = template(dataWithYear);

			// Create new page
			if (!this.browser) {
				throw new Error("Browser not initialized");
			}

			const page = await this.browser.newPage();

			try {
				// Set content
				await page.setContent(html, {
					waitUntil: "networkidle0",
				});

				// Generate PDF
				const pdfBuffer = await page.pdf({
					format: "A4",
					printBackground: true,
					margin: {
						top: "20mm",
						right: "20mm",
						bottom: "20mm",
						left: "20mm",
					},
					preferCSSPageSize: true,
				});

				return Buffer.from(pdfBuffer);
			} finally {
				await page.close();
			}
		} catch (error) {
			console.error("PDF generation failed:", error);
			throw new Error(`Failed to generate PDF: ${error}`);
		}
	}

	/**
	 * Save PDF to file system
	 */
	async savePDF(pdfBuffer: Buffer, filename: string): Promise<string> {
		const outputDir = path.join(process.cwd(), "public", "invoices", "pdfs");

		// Ensure directory exists
		await fs.mkdir(outputDir, { recursive: true });

		const filePath = path.join(outputDir, filename);

		await fs.writeFile(filePath, pdfBuffer);

		// Return relative URL path
		return `/invoices/pdfs/${filename}`;
	}

	/**
	 * Generate and save invoice PDF
	 */
	async generateAndSave(
		invoiceData: any,
		invoiceNumber: string,
		templateName: string = "luxury-template",
	): Promise<{ buffer: Buffer; url: string }> {
		const pdfBuffer = await this.generateInvoicePDF(invoiceData, templateName);

		// Sanitize invoice number for filename
		const filename = `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

		const url = await this.savePDF(pdfBuffer, filename);

		return {
			buffer: pdfBuffer,
			url,
		};
	}
}

// Singleton instance
export const pdfService = new PDFGenerationService();

// Cleanup on process exit
process.on("exit", () => {
	pdfService.close();
});

process.on("SIGINT", async () => {
	await pdfService.close();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await pdfService.close();
	process.exit(0);
});

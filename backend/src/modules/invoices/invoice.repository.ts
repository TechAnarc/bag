/**
 * Invoice Repository
 * Data access layer for Invoice operations
 */

import prisma from "../../config/database";
import type { Invoice, Prisma } from "@prisma/client";

export class InvoiceRepository {
	/**
	 * Create new invoice
	 */
	async create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
		return prisma.invoice.create({
			data,
			include: {
				order: {
					include: {
						items: {
							include: {
								product: true,
							},
						},
						user: true,
					},
				},
			},
		});
	}

	/**
	 * Find invoice by ID
	 */
	async findById(id: string): Promise<Invoice | null> {
		return prisma.invoice.findUnique({
			where: { id },
			include: {
				order: {
					include: {
						items: {
							include: {
								product: true,
							},
						},
						user: true,
					},
				},
			},
		});
	}

	/**
	 * Find invoice by invoice number
	 */
	async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
		return prisma.invoice.findUnique({
			where: { invoiceNumber },
			include: {
				order: {
					include: {
						items: {
							include: {
								product: true,
							},
						},
						user: true,
					},
				},
			},
		});
	}

	/**
	 * Find invoice by order ID
	 */
	async findByOrderId(orderId: string): Promise<Invoice | null> {
		return prisma.invoice.findUnique({
			where: { orderId },
			include: {
				order: {
					include: {
						items: {
							include: {
								product: true,
							},
						},
						user: true,
					},
				},
			},
		});
	}

	/**
	 * Update invoice
	 */
	async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
		return prisma.invoice.update({
			where: { id },
			data,
			include: {
				order: {
					include: {
						items: {
							include: {
								product: true,
							},
						},
						user: true,
					},
				},
			},
		});
	}

	/**
	 * Find all invoices with filters
	 */
	async findMany(
		filters: {
			tenantId?: string;
			paymentStatus?: string;
			fiscalYear?: string;
			startDate?: Date;
			endDate?: Date;
		} = {},
		pagination: {
			skip?: number;
			take?: number;
		} = {},
	): Promise<Invoice[]> {
		const where: Prisma.InvoiceWhereInput = {};

		if (filters.tenantId) {
			where.tenantId = filters.tenantId;
		}

		if (filters.paymentStatus) {
			where.paymentStatus = filters.paymentStatus;
		}

		if (filters.fiscalYear) {
			where.fiscalYear = filters.fiscalYear;
		}

		if (filters.startDate || filters.endDate) {
			where.invoiceDate = {};
			if (filters.startDate) {
				where.invoiceDate.gte = filters.startDate;
			}
			if (filters.endDate) {
				where.invoiceDate.lte = filters.endDate;
			}
		}

		return prisma.invoice.findMany({
			where,
			include: {
				order: {
					include: {
						user: true,
					},
				},
			},
			orderBy: {
				invoiceDate: "desc",
			},
			skip: pagination.skip,
			take: pagination.take,
		});
	}

	/**
	 * Count invoices with filters
	 */
	async count(
		filters: {
			tenantId?: string;
			paymentStatus?: string;
			fiscalYear?: string;
		} = {},
	): Promise<number> {
		const where: Prisma.InvoiceWhereInput = {};

		if (filters.tenantId) {
			where.tenantId = filters.tenantId;
		}

		if (filters.paymentStatus) {
			where.paymentStatus = filters.paymentStatus;
		}

		if (filters.fiscalYear) {
			where.fiscalYear = filters.fiscalYear;
		}

		return prisma.invoice.count({ where });
	}

	/**
	 * Verify invoice by hash
	 */
	async verifyByHash(pdfHash: string): Promise<Invoice | null> {
		return prisma.invoice.findFirst({
			where: { pdfHash },
			include: {
				order: {
					include: {
						items: {
							include: {
								product: true,
							},
						},
						user: true,
					},
				},
			},
		});
	}

	/**
	 * Delete invoice (soft delete by marking as void)
	 */
	async delete(id: string): Promise<Invoice> {
		return prisma.invoice.update({
			where: { id },
			data: {
				watermark: "VOID",
				notes: "Invoice voided",
			},
		});
	}
}

export const invoiceRepository = new InvoiceRepository();

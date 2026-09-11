/**
 * Reconciliation Service
 * Correlates Razorpay orders, payments, refunds, settlements with internal orders.
 * Guarantees financial ledger consistency for:
 *   - Partial captures
 *   - Partial/multi refunds
 *   - Settlement delays
 *   - Failed refund retries
 */

import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { v4 as uuidv4 } from "uuid";

export class ReconciliationService {
	/**
	 * Record a reconciliation entry and detect discrepancies.
	 */
	async record(opts: {
		type: string; // PAYMENT_CAPTURE | REFUND | SETTLEMENT
		orderId?: string;
		razorpayPaymentId?: string;
		razorpayOrderId?: string;
		razorpayRefundId?: string;
		razorpaySettlementId?: string;
		expectedAmountPaise?: number;
		actualAmountPaise?: number;
		correlationId?: string;
	}): Promise<void> {
		const discrepancy =
			opts.expectedAmountPaise !== undefined &&
			opts.actualAmountPaise !== undefined
				? opts.actualAmountPaise - opts.expectedAmountPaise
				: null;

		const status =
			discrepancy === null
				? "PENDING"
				: discrepancy === 0
					? "MATCHED"
					: "DISCREPANT";

		try {
			await prisma.reconciliationLedger.create({
				data: {
					id: uuidv4(),
					type: opts.type,
					orderId: opts.orderId ?? null,
					razorpayPaymentId: opts.razorpayPaymentId ?? null,
					razorpayOrderId: opts.razorpayOrderId ?? null,
					razorpayRefundId: opts.razorpayRefundId ?? null,
					razorpaySettlementId: opts.razorpaySettlementId ?? null,
					expectedAmountPaise: opts.expectedAmountPaise ?? null,
					actualAmountPaise: opts.actualAmountPaise ?? null,
					discrepancy,
					status,
					correlationId: opts.correlationId ?? null,
				},
			});

			if (status === "DISCREPANT") {
				logger.warn(`[Reconciliation] ⚠️  DISCREPANCY detected [${opts.type}]`, {
					orderId: opts.orderId,
					razorpayPaymentId: opts.razorpayPaymentId,
					expectedAmountPaise: opts.expectedAmountPaise,
					actualAmountPaise: opts.actualAmountPaise,
					discrepancy,
				});
			}
		} catch (err: any) {
			logger.error(`[Reconciliation] Failed to record entry: ${err.message}`);
		}
	}

	/**
	 * Calculate cumulative refund amount for a payment and validate
	 * it does not exceed the captured amount.
	 */
	async validateRefundAmount(
		razorpayPaymentId: string,
		newRefundAmountPaise: number,
	): Promise<{ valid: boolean; totalRefunded: number; message?: string }> {
		try {
			const payment = await prisma.paymentRecord.findUnique({
				where: { razorpayPaymentId },
			});

			if (!payment) {
				return { valid: false, totalRefunded: 0, message: "Payment not found" };
			}

			const existingRefunds = await prisma.refundRecord.findMany({
				where: { razorpayPaymentId, status: { not: "FAILED" } },
				select: { amountPaise: true },
			});

			const totalRefunded = existingRefunds.reduce(
				(sum: number, r: any) => sum + r.amountPaise,
				0,
			);
			const projectedTotal = totalRefunded + newRefundAmountPaise;

			if (projectedTotal > payment.amountPaise) {
				return {
					valid: false,
					totalRefunded,
					message: `Refund would exceed captured amount. Captured: ₹${payment.amountPaise / 100}, Already refunded: ₹${totalRefunded / 100}, Requested: ₹${newRefundAmountPaise / 100}`,
				};
			}

			return { valid: true, totalRefunded };
		} catch (err: any) {
			logger.error(
				`[Reconciliation] validateRefundAmount error: ${err.message}`,
			);
			return {
				valid: false,
				totalRefunded: 0,
				message: "Reconciliation check failed",
			};
		}
	}

	/**
	 * Get all discrepant records for operational review.
	 */
	async getDiscrepancies(limit = 50): Promise<any[]> {
		return prisma.reconciliationLedger.findMany({
			where: { status: "DISCREPANT" },
			orderBy: { createdAt: "desc" },
			take: limit,
		});
	}

	/**
	 * Mark a reconciliation entry as resolved.
	 */
	async resolve(id: string, notes?: string): Promise<void> {
		await prisma.reconciliationLedger.update({
			where: { id },
			data: { status: "RESOLVED", resolvedAt: new Date(), notes },
		});
	}
}

export const reconciliationService = new ReconciliationService();

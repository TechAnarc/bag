/**
 * Refund Event Processors
 * Handles: refund.created, refund.processed, refund.failed
 *
 * Maintains refund lineage → original payment → order.
 * Validates cumulative refund amounts for ledger consistency.
 */

import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { v4 as uuidv4 } from "uuid";
import { paymentAuditService } from "../services/payment-audit.service";
import { domainEventBus } from "../services/domain-event.bus";
import { reconciliationService } from "../services/reconciliation.service";
import type { RazorpayRefundEntity } from "../webhook/webhook-event.types";

export async function handleRefundCreated(
	entity: RazorpayRefundEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(
		`[RefundProcessor] 💸 refund.created | id=${entity.id} payment=${entity.payment_id} ₹${entity.amount / 100}`,
		{ correlationId },
	);

	// 1. Validate cumulative refund amount
	const validation = await reconciliationService.validateRefundAmount(
		entity.payment_id,
		entity.amount,
	);
	if (!validation.valid) {
		logger.error(
			`[RefundProcessor] Refund amount validation FAILED: ${validation.message}`,
		);
		// Still persist for audit but flag the issue
	}

	// 2. Idempotent refund record upsert
	await prisma.refundRecord.upsert({
		where: { razorpayRefundId: entity.id },
		update: {
			status: entity.status.toUpperCase(),
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpayRefundId: entity.id,
			razorpayPaymentId: entity.payment_id,
			amountPaise: entity.amount,
			currency: entity.currency,
			status: "INITIATED",
			speedProcessed: entity.speed_processed ?? null,
			notes: entity.notes as any,
			receipt: entity.receipt ?? null,
			batchId: entity.batch_id ?? null,
			acquirerData: entity.acquirer_data as any,
			idempotencyKey: `refund:${entity.id}`,
			correlationId,
		},
	});

	// 3. Link order and update payment record status
	const paymentRecord = await prisma.paymentRecord.findUnique({
		where: { razorpayPaymentId: entity.payment_id },
	}).catch(() => null);

	let orderId = paymentRecord?.orderId;
	if (!orderId) {
		const order = await prisma.order.findFirst({
			where: {
				OR: [
					{ razorpayPaymentId: entity.payment_id },
					...(paymentRecord?.razorpayOrderId ? [{ razorpayOrderId: paymentRecord.razorpayOrderId }] : []),
				],
			},
		});
		orderId = order?.id;
	}

	if (orderId) {
		await prisma.refundRecord.update({
			where: { razorpayRefundId: entity.id },
			data: { orderId: orderId },
		});

		await prisma.$transaction(async (tx) => {
			await tx.order.update({
				where: { id: orderId },
				data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
			});
			await tx.orderTimelineEvent.create({
				data: {
					id: uuidv4(),
					orderId: orderId,
					status: "REFUNDED",
					title: "Refund Initiated",
					description: `Refund of ₹${entity.amount / 100} initiated. Refund ID: ${entity.id}`,
					actor: "RAZORPAY_WEBHOOK",
					metadata: { refundId: entity.id, amountPaise: entity.amount } as any,
				},
			});
			// Debit ledger for refund
			await tx.ledgerEntry.create({
				data: {
					id: uuidv4(),
					tenantId: "default",
					orderId: orderId,
					type: "DEBIT",
					amount: entity.amount / 100,
					currency: entity.currency,
					source: "RAZORPAY_REFUND",
					description: `Refund issued for order. Refund ID: ${entity.id}`,
					metadata: {
						razorpayRefundId: entity.id,
						razorpayPaymentId: entity.payment_id,
					} as any,
				},
			});
		}, {
			maxWait: 10000,
			timeout: 25000,
		});

		// Reconcile
		await reconciliationService.record({
			type: "REFUND",
			orderId: orderId,
			razorpayPaymentId: entity.payment_id,
			razorpayRefundId: entity.id,
			actualAmountPaise: entity.amount,
			correlationId,
		});
	}

	// 4. Audit
	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "REFUND_CREATED",
		toStatus: "REFUND_INITIATED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			refundId: entity.id,
			amount: entity.amount,
			speedProcessed: entity.speed_processed,
		},
		correlationId,
		webhookEventId,
	});

	// 5. Domain events
	await domainEventBus.publish({
		eventType: "REFUND_INITIATED",
		aggregateType: "Refund",
		aggregateId: entity.id,
		payload: {
			refundId: entity.id,
			paymentId: entity.payment_id,
			amount: entity.amount,
		},
		correlationId,
	});
}

export async function handleRefundProcessed(
	entity: RazorpayRefundEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(`[RefundProcessor] ✅ refund.processed | id=${entity.id}`, {
		correlationId,
	});

	await prisma.refundRecord.updateMany({
		where: { razorpayRefundId: entity.id },
		data: {
			status: "PROCESSED",
			processedAt: new Date(),
			updatedAt: new Date(),
		},
	});

	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "REFUND_PROCESSED",
		fromStatus: "REFUND_INITIATED",
		toStatus: "REFUND_PROCESSED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { refundId: entity.id },
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: "REFUND_COMPLETED",
		aggregateType: "Refund",
		aggregateId: entity.id,
		payload: {
			refundId: entity.id,
			paymentId: entity.payment_id,
			amount: entity.amount,
		},
		correlationId,
	});
}

export async function handleRefundFailed(
	entity: RazorpayRefundEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.error(`[RefundProcessor] ❌ refund.failed | id=${entity.id}`, {
		correlationId,
	});

	await prisma.refundRecord.updateMany({
		where: { razorpayRefundId: entity.id },
		data: {
			status: "FAILED",
			failedAt: new Date(),
			retryCount: { increment: 1 },
			updatedAt: new Date(),
		},
	});

	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "REFUND_FAILED",
		toStatus: "REFUND_FAILED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { refundId: entity.id },
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: "REFUND_FAILED",
		aggregateType: "Refund",
		aggregateId: entity.id,
		payload: { refundId: entity.id, paymentId: entity.payment_id },
		correlationId,
	});
}

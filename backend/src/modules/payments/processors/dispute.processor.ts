/**
 * Dispute Event Processors
 * Handles the full dispute lifecycle:
 * created → under_review → action_required → won/lost/closed
 */

import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { paymentAuditService } from "../services/payment-audit.service";
import { domainEventBus } from "../services/domain-event.bus";
import type { RazorpayDisputeEntity } from "../webhook/webhook-event.types";

async function upsertDispute(
	entity: RazorpayDisputeEntity,
	correlationId: string,
) {
	await prisma.disputeRecord.upsert({
		where: { razorpayDisputeId: entity.id },
		update: {
			status: entity.status,
			phase: entity.phase,
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpayDisputeId: entity.id,
			razorpayPaymentId: entity.payment_id,
			amountPaise: entity.amount,
			currency: entity.currency,
			status: entity.status,
			phase: entity.phase,
			reason: entity.reason_code ?? null,
			respondBy: entity.respond_by ? new Date(entity.respond_by * 1000) : null,
			evidence: entity.evidence as any,
			correlationId,
		},
	});
}

export async function handleDisputeCreated(
	entity: RazorpayDisputeEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.warn(
		`[DisputeProcessor] ⚠️  payment.dispute.created | id=${entity.id} reason=${entity.reason_code}`,
		{ correlationId },
	);
	await upsertDispute(entity, correlationId);

	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "DISPUTE_CREATED",
		toStatus: entity.status,
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			disputeId: entity.id,
			phase: entity.phase,
			reason: entity.reason_code,
			respondBy: entity.respond_by,
		},
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: "DISPUTE_OPENED",
		aggregateType: "Dispute",
		aggregateId: entity.id,
		payload: {
			disputeId: entity.id,
			paymentId: entity.payment_id,
			amount: entity.amount,
			reason: entity.reason_code,
			respondBy: entity.respond_by,
		},
		correlationId,
	});
}

export async function handleDisputeWon(
	entity: RazorpayDisputeEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(`[DisputeProcessor] 🏆 payment.dispute.won | id=${entity.id}`, {
		correlationId,
	});
	await prisma.disputeRecord.updateMany({
		where: { razorpayDisputeId: entity.id },
		data: { status: "won", wonAt: new Date(), updatedAt: new Date() },
	});
	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "DISPUTE_WON",
		toStatus: "won",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { disputeId: entity.id },
		correlationId,
		webhookEventId,
	});
	await domainEventBus.publish({
		eventType: "DISPUTE_WON",
		aggregateType: "Dispute",
		aggregateId: entity.id,
		payload: { disputeId: entity.id, paymentId: entity.payment_id },
		correlationId,
	});
}

export async function handleDisputeLost(
	entity: RazorpayDisputeEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.error(`[DisputeProcessor] 💔 payment.dispute.lost | id=${entity.id}`, {
		correlationId,
	});
	await prisma.disputeRecord.updateMany({
		where: { razorpayDisputeId: entity.id },
		data: { status: "lost", lostAt: new Date(), updatedAt: new Date() },
	});
	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "DISPUTE_LOST",
		toStatus: "lost",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { disputeId: entity.id },
		correlationId,
		webhookEventId,
	});
	await domainEventBus.publish({
		eventType: "DISPUTE_LOST",
		aggregateType: "Dispute",
		aggregateId: entity.id,
		payload: {
			disputeId: entity.id,
			paymentId: entity.payment_id,
			amount: entity.amount,
		},
		correlationId,
	});
}

export async function handleDisputeClosed(
	entity: RazorpayDisputeEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(
		`[DisputeProcessor] 🔒 payment.dispute.closed | id=${entity.id}`,
		{ correlationId },
	);
	await prisma.disputeRecord.updateMany({
		where: { razorpayDisputeId: entity.id },
		data: { status: "closed", updatedAt: new Date() },
	});
	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "DISPUTE_CLOSED",
		toStatus: "closed",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { disputeId: entity.id },
		correlationId,
		webhookEventId,
	});
	await domainEventBus.publish({
		eventType: "DISPUTE_CLOSED",
		aggregateType: "Dispute",
		aggregateId: entity.id,
		payload: { disputeId: entity.id, paymentId: entity.payment_id },
		correlationId,
	});
}

export async function handleDisputeUnderReview(
	entity: RazorpayDisputeEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(
		`[DisputeProcessor] 🔍 payment.dispute.under_review | id=${entity.id}`,
		{ correlationId },
	);
	await upsertDispute(entity, correlationId);
	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "DISPUTE_UNDER_REVIEW",
		toStatus: "under_review",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { disputeId: entity.id },
		correlationId,
		webhookEventId,
	});
}

export async function handleDisputeActionRequired(
	entity: RazorpayDisputeEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.warn(
		`[DisputeProcessor] 🚨 payment.dispute.action_required | id=${entity.id}`,
		{ correlationId },
	);
	await upsertDispute(entity, correlationId);
	await paymentAuditService.log({
		paymentId: entity.payment_id,
		eventType: "DISPUTE_ACTION_REQUIRED",
		toStatus: "action_required",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { disputeId: entity.id, respondBy: entity.respond_by },
		correlationId,
		webhookEventId,
	});
}

/**
 * Subscription Event Processors
 * Handles the full subscription lifecycle.
 */

import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { paymentAuditService } from "../services/payment-audit.service";
import {
	domainEventBus,
	InternalDomainEventType,
} from "../services/domain-event.bus";
import type { RazorpaySubscriptionEntity } from "../webhook/webhook-event.types";

async function upsertSubscription(
	entity: RazorpaySubscriptionEntity,
	correlationId: string,
) {
	await (prisma as any).subscriptionRecord.upsert({
		where: { razorpaySubscriptionId: entity.id },
		update: {
			status: entity.status,
			paidCount: entity.paid_count,
			remainingCount: entity.remaining_count,
			currentStart: entity.current_start
				? new Date(entity.current_start * 1000)
				: null,
			currentEnd: entity.current_end
				? new Date(entity.current_end * 1000)
				: null,
			chargeAt: entity.charge_at ? new Date(entity.charge_at * 1000) : null,
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpaySubscriptionId: entity.id,
			planId: entity.plan_id,
			customerId: entity.customer_id ?? null,
			status: entity.status,
			quantity: entity.quantity,
			totalCount: entity.total_count,
			paidCount: entity.paid_count,
			remainingCount: entity.remaining_count,
			currentStart: entity.current_start
				? new Date(entity.current_start * 1000)
				: null,
			currentEnd: entity.current_end
				? new Date(entity.current_end * 1000)
				: null,
			chargeAt: entity.charge_at ? new Date(entity.charge_at * 1000) : null,
			notes: entity.notes as any,
			correlationId,
		},
	});
}

type SubscriptionEvent = {
	eventType: InternalDomainEventType;
	logLabel: string;
	auditEvent: string;
	logFn: "info" | "warn" | "error";
};

const SUB_EVENT_MAP: Record<string, SubscriptionEvent> = {
	"subscription.authenticated": {
		eventType: "SUBSCRIPTION_ACTIVATED",
		logLabel: "🔐 authenticated",
		auditEvent: "SUBSCRIPTION_AUTHENTICATED",
		logFn: "info",
	},
	"subscription.activated": {
		eventType: "SUBSCRIPTION_ACTIVATED",
		logLabel: "✅ activated",
		auditEvent: "SUBSCRIPTION_ACTIVATED",
		logFn: "info",
	},
	"subscription.charged": {
		eventType: "SUBSCRIPTION_CHARGED",
		logLabel: "💳 charged",
		auditEvent: "SUBSCRIPTION_CHARGED",
		logFn: "info",
	},
	"subscription.completed": {
		eventType: "SUBSCRIPTION_CANCELLED",
		logLabel: "🏁 completed",
		auditEvent: "SUBSCRIPTION_COMPLETED",
		logFn: "info",
	},
	"subscription.updated": {
		eventType: "SUBSCRIPTION_ACTIVATED",
		logLabel: "✏️  updated",
		auditEvent: "SUBSCRIPTION_UPDATED",
		logFn: "info",
	},
	"subscription.pending": {
		eventType: "SUBSCRIPTION_HALTED",
		logLabel: "⏳ pending",
		auditEvent: "SUBSCRIPTION_PENDING",
		logFn: "warn",
	},
	"subscription.halted": {
		eventType: "SUBSCRIPTION_HALTED",
		logLabel: "⛔ halted",
		auditEvent: "SUBSCRIPTION_HALTED",
		logFn: "error",
	},
	"subscription.cancelled": {
		eventType: "SUBSCRIPTION_CANCELLED",
		logLabel: "🚫 cancelled",
		auditEvent: "SUBSCRIPTION_CANCELLED",
		logFn: "warn",
	},
	"subscription.paused": {
		eventType: "SUBSCRIPTION_HALTED",
		logLabel: "⏸️  paused",
		auditEvent: "SUBSCRIPTION_PAUSED",
		logFn: "warn",
	},
	"subscription.resumed": {
		eventType: "SUBSCRIPTION_RESUMED",
		logLabel: "▶️  resumed",
		auditEvent: "SUBSCRIPTION_RESUMED",
		logFn: "info",
	},
};

export async function handleSubscriptionEvent(
	razorpayEvent: string,
	entity: RazorpaySubscriptionEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	const meta = SUB_EVENT_MAP[razorpayEvent];
	if (!meta) {
		logger.warn(
			`[SubscriptionProcessor] Unknown subscription event: ${razorpayEvent}`,
		);
		return;
	}

	logger[meta.logFn](
		`[SubscriptionProcessor] ${meta.logLabel} | id=${entity.id}`,
		{ correlationId },
	);
	await upsertSubscription(entity, correlationId);

	// Track ended_at for terminal states
	if (
		[
			"subscription.cancelled",
			"subscription.completed",
			"subscription.expired",
		].includes(razorpayEvent)
	) {
		await (prisma as any).subscriptionRecord.updateMany({
			where: { razorpaySubscriptionId: entity.id },
			data: { endedAt: new Date() },
		});
	}

	await paymentAuditService.log({
		eventType: meta.auditEvent,
		toStatus: entity.status,
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			subscriptionId: entity.id,
			planId: entity.plan_id,
			paidCount: entity.paid_count,
		},
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: meta.eventType,
		aggregateType: "Subscription",
		aggregateId: entity.id,
		payload: {
			subscriptionId: entity.id,
			planId: entity.plan_id,
			status: entity.status,
			paidCount: entity.paid_count,
			customerId: entity.customer_id,
		},
		correlationId,
	});
}

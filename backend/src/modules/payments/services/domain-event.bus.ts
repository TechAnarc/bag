/**
 * Domain Event Outbox Publisher
 * Persists internal domain events for downstream consumers:
 * fulfillment, notifications, analytics, accounting, CRM.
 *
 * Uses transactional outbox pattern: events written in same
 * transaction as business state mutations, then dispatched by a
 * background relay (or inline flush for non-transactional usage).
 */

import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { v4 as uuidv4 } from "uuid";

// ─── Internal Domain Event Catalogue ─────────────────────────────────────────
export type InternalDomainEventType =
	| "PAYMENT_CONFIRMED"
	| "PAYMENT_FAILED"
	| "PAYMENT_AUTHORIZED"
	| "REFUND_INITIATED"
	| "REFUND_COMPLETED"
	| "REFUND_FAILED"
	| "DISPUTE_OPENED"
	| "DISPUTE_WON"
	| "DISPUTE_LOST"
	| "DISPUTE_CLOSED"
	| "SUBSCRIPTION_ACTIVATED"
	| "SUBSCRIPTION_CHARGED"
	| "SUBSCRIPTION_CANCELLED"
	| "SUBSCRIPTION_HALTED"
	| "SUBSCRIPTION_RESUMED"
	| "SETTLEMENT_RECONCILED"
	| "INVOICE_PAID"
	| "INVOICE_EXPIRED"
	| "PAYMENT_LINK_COMPLETED"
	| "PAYMENT_LINK_EXPIRED"
	| "PAYMENT_DOWNTIME_STARTED"
	| "PAYMENT_DOWNTIME_RESOLVED"
	| "FUND_ACCOUNT_VALIDATED"
	| "ACCOUNT_ACTIVATED";

export interface DomainEventPayload {
	eventType: InternalDomainEventType;
	aggregateType: string;
	aggregateId: string;
	payload: Record<string, unknown>;
	correlationId?: string;
}

class DomainEventBus {
	/**
	 * Publish one or more domain events to the outbox.
	 * Silently absorbs errors — domain events must not block business state.
	 */
	async publish(...events: DomainEventPayload[]): Promise<void> {
		if (!events.length) return;
		try {
			await prisma.domainEventOutbox.createMany({
				data: events.map((e) => ({
					id: uuidv4(),
					eventType: e.eventType,
					aggregateType: e.aggregateType,
					aggregateId: e.aggregateId,
					payload: e.payload as any,
					correlationId: e.correlationId ?? null,
					published: false,
					createdAt: new Date(),
				})),
			});
			events.forEach((e) => {
				logger.info(
					`[DomainEventBus] 📢 ${e.eventType} → ${e.aggregateType}/${e.aggregateId}`,
					{
						correlationId: e.correlationId,
					},
				);
			});
		} catch (err: any) {
			logger.error(
				`[DomainEventBus] Failed to persist domain events: ${err.message}`,
			);
		}
	}

	/**
	 * Flush unpublished outbox events to in-process subscribers.
	 * In production this would dispatch to Redis pub/sub, SNS, or similar.
	 * Here we emit structured logs that operational systems can consume.
	 */
	async flushOutbox(limit = 50): Promise<void> {
		try {
			const events = await prisma.domainEventOutbox.findMany({
				where: { published: false, retryCount: { lt: 5 } },
				orderBy: { createdAt: "asc" },
				take: limit,
			});

			if (!events.length) return;

			const ids = events.map((e: any) => e.id);
			await prisma.domainEventOutbox.updateMany({
				where: { id: { in: ids } },
				data: { published: true, publishedAt: new Date() },
			});

			events.forEach((e: any) => {
				logger.info(`[DomainEventBus] ✅ Flushed: ${e.eventType}`, {
					aggregateId: e.aggregateId,
					correlationId: e.correlationId,
				});
			});
		} catch (err: any) {
			logger.error(`[DomainEventBus] Outbox flush error: ${err.message}`);
		}
	}
}

export const domainEventBus = new DomainEventBus();

// Start outbox relay every 30 seconds
setInterval(() => domainEventBus.flushOutbox().catch(() => {}), 30_000);

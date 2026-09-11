import { EventEmitter } from "events";
import { logger } from "../../config/logger";
import { v4 as uuidv4 } from "uuid";
import { IEventBus, EventEnvelope } from "./event-bus.interface";
import { prisma } from "../../config/database";

export enum DomainEvent {
	ORDER_CREATED = "order.created",
	PAYMENT_CONFIRMED = "payment.confirmed",
	ORDER_PROCESSING = "order.processing",
	ORDER_PACKED = "order.packed",
	ORDER_SHIPPED = "order.shipped",
	OUT_FOR_DELIVERY = "order.out_for_delivery",
	ORDER_DELIVERED = "order.delivered",
	ORDER_COMPLETED = "order.completed",
	ORDER_CANCELLED = "order.cancelled",
	REFUND_INITIATED = "refund.initiated",
	REFUND_COMPLETED = "refund.completed",
	RETURN_REQUESTED = "return.requested",
	RETURN_APPROVED = "return.approved",
	INVENTORY_RESERVED = "inventory.reserved",
	SLA_BREACHED = "sla.breached",
	LEDGER_ENTRY_CREATED = "ledger.entry.created",
	FRAUD_FLAGGED = "fraud.flagged",
	ORDER_UPDATED = "order.updated",
	// Specialized Logistics Stream (Phase 3/6)
	PICKUP_PENDING = "logistics.pickup.pending",
	PICKUP_ASSIGNED = "logistics.pickup.assigned",
	PICKUP_CONFIRMED = "logistics.pickup.confirmed",
	PICKUP_COMPLETED = "logistics.pickup.completed",
	IN_TRANSIT = "logistics.in_transit",
	DELIVERY_FAILED = "logistics.delivery.failed",
	RETURN_INITIATED = "logistics.return.initiated",
	RETURN_COMPLETED = "logistics.return.completed",
	// Behavioral & UI Events (UPIS Ingestion)
	USER_LOGIN = "user.login",
	USER_LOGOUT = "user.logout",
	PRODUCT_VIEWED = "product.viewed",
	WISHLIST_UPDATED = "wishlist.updated",
	CART_UPDATED = "cart.updated",
	CHECKOUT_STARTED = "checkout.started",
	REVIEW_SUBMITTED = "review.submitted",
	INQUIRY_SUBMITTED = "inquiry.submitted",
}

class LocalEventAdapter implements IEventBus {
	private emitter: EventEmitter;

	constructor() {
		this.emitter = new EventEmitter();
		this.emitter.setMaxListeners(100);
	}

	async publish(
		event: DomainEvent,
		payload: any,
		metadata: Partial<EventEnvelope> = {},
	): Promise<void> {
		const envelope: EventEnvelope = {
			eventId: uuidv4(),
			eventType: event,
			version: "1.0",
			occurredAt: new Date(),
			correlationId: metadata.correlationId || uuidv4(),
			actor: metadata.actor || "SYSTEM",
			tenantId: metadata.tenantId,
			payload,
			...metadata,
		};

		logger.debug(`[EventBus:Local] Publishing ${event}`, {
			eventId: envelope.eventId,
		});
		this.emitter.emit(event, envelope);
	}

	subscribe(
		event: DomainEvent,
		handler: (envelope: EventEnvelope) => void,
	): void {
		this.emitter.on(event, handler);
	}
}

import { RedisEventAdapter } from "./redis-event-adapter";
import { env } from "../../config/env";

class EventBus {
	private static instance: EventBus;
	private adapter: IEventBus;

	private constructor() {
		if (env.REDIS_URL) {
			this.adapter = new RedisEventAdapter();
			logger.info("[EventBus] Initialized with Redis adapter");
		} else {
			this.adapter = new LocalEventAdapter();
			logger.warn(
				"[EventBus] REDIS_URL not found, falling back to Local adapter",
			);
		}
	}

	public static getInstance(): EventBus {
		if (!EventBus.instance) {
			EventBus.instance = new EventBus();
		}
		return EventBus.instance;
	}

	public setAdapter(adapter: IEventBus) {
		this.adapter = adapter;
		logger.info("[EventBus] Switched to new adapter");
	}

	public async emitDomainEvent(
		event: DomainEvent,
		payload: any,
		metadata: Partial<EventEnvelope> = {},
	) {
		const envelope: EventEnvelope = {
			eventId: uuidv4(),
			eventType: event,
			version: metadata.version || "1.0",
			occurredAt: new Date(),
			correlationId: metadata.correlationId || uuidv4(),
			actor: metadata.actor || "SYSTEM",
			tenantId: metadata.tenantId,
			payload,
			...metadata,
		};

		// 1. Persistence (Replay Capability)
		try {
			await prisma.domainEventLog.create({
				data: {
					eventId: envelope.eventId,
					eventType: envelope.eventType,
					version: envelope.version,
					payload: envelope.payload as any,
					metadata: {
						actor: envelope.actor,
						correlationId: envelope.correlationId,
						tenantId: envelope.tenantId,
					} as any,
					occurredAt: envelope.occurredAt,
					correlationId: envelope.correlationId,
					actor: envelope.actor,
					tenantId: envelope.tenantId,
				},
			});
		} catch (err) {
			logger.error(
				`[EventBus] Failed to persist event ${envelope.eventId}`,
				err,
			);
		}

		// 2. Propagation
		await this.adapter.publish(event, payload, envelope);
	}

	public subscribe(event: DomainEvent, handler: (payload: any) => void) {
		// Compatibility layer for Phase 4 services
		this.adapter.subscribe(event, (envelope) => {
			handler(envelope.payload);
		});
	}

	public subscribeWithEnvelope(
		event: DomainEvent,
		handler: (envelope: EventEnvelope) => void,
	) {
		this.adapter.subscribe(event, handler);
	}
}

export const eventBus = EventBus.getInstance();

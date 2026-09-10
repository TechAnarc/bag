import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { SocketService } from "../../config/socket";
import { logger } from "../../config/logger";

/**
 * 🛰️ Bridges Intelligence Telemetry to the Live Admin Command Center.
 * Enables real-time timeline propagation and active-user streaming.
 */
export class UpisSocketSubscriber {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		// Behavioral stream hooks
		eventBus.subscribeWithEnvelope(DomainEvent.PRODUCT_VIEWED, (env) =>
			this.broadcastBehavior(env),
		);
		eventBus.subscribeWithEnvelope(DomainEvent.CART_UPDATED, (env) =>
			this.broadcastBehavior(env),
		);
		eventBus.subscribeWithEnvelope(DomainEvent.CHECKOUT_STARTED, (env) =>
			this.broadcastBehavior(env),
		);
		eventBus.subscribeWithEnvelope(DomainEvent.USER_LOGIN, (env) =>
			this.broadcastBehavior(env),
		);

		logger.info(
			"🛰️ UpisSocketSubscriber activated: Live Telemetry Streaming online.",
		);
	}

	/**
	 * Format the event for Socket transit and broadcast directly to authenticated admins
	 */
	private broadcastBehavior(envelope: any) {
		try {
			// Format specifically for the Timeline UI payload
			const broadcastPayload = {
				id: envelope.eventId,
				eventType: envelope.eventType,
				occurredAt: envelope.occurredAt || new Date(),
				actor: envelope.actor,
				payload: envelope.payload,
				isRealtime: true,
			};

			// Send to general admin channel
			SocketService.emitToAdmins("upis:live_event", broadcastPayload);

			// Special channel for targeted user views if active
			const userId = envelope.payload.userId || envelope.actor;
			if (userId && userId !== "GUEST") {
				SocketService.emitToRoom(
					`admin:user:${userId}`,
					"upis:live_event",
					broadcastPayload,
				);
			}

			logger.debug(`[Socket:UPIS] Broadcasted ${envelope.eventType}`);
		} catch (e) {
			logger.error("[Socket:UPIS] Broadcast error", e);
		}
	}
}

export const upisSocketSubscriber = new UpisSocketSubscriber();

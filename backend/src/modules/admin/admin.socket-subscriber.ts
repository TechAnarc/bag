import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { SocketService } from "../../config/socket";
import { logger } from "../../config/logger";

/**
 * Bridges internal Domain Events to external WebSocket broadcasts for the Admin Panel.
 * This enables the "Real-Time Order Sync" requirement for TRIVENI-OS-1.
 */
export class AdminSocketSubscriber {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		// Order lifecycle events
		eventBus.subscribe(
			DomainEvent.ORDER_CREATED,
			this.onOrderCreated.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.ORDER_UPDATED,
			this.onOrderUpdated.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.ORDER_COMPLETED,
			this.onOrderUpdated.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.ORDER_CANCELLED,
			this.onOrderUpdated.bind(this),
		);

		// Surveillance alerts
		eventBus.subscribe(DomainEvent.SLA_BREACHED, this.onSLABreach.bind(this));

		// Fraud alerts
		eventBus.subscribe(
			DomainEvent.FRAUD_FLAGGED,
			this.onFraudFlagged.bind(this),
		);

		logger.info(
			"📡 AdminSocketSubscriber initialized: Real-time surveillance active",
		);
	}

	private onOrderCreated(order: any) {
		SocketService.emitToAdmins("order:created", order);
		SocketService.emitToAdmins("surveillance:velocity_update", { delta: 1 });
	}

	private onOrderUpdated(order: any) {
		SocketService.emitToAdmins("order:updated", order);
		SocketService.emitToOrder(order.id, "order:updated", order);
	}

	private onSLABreach(payload: any) {
		SocketService.emitToAdmins("surveillance:sla_breach", payload);
		SocketService.emitToAdmins("order:updated", payload); // Notify list to refresh node status
	}

	private onFraudFlagged(payload: any) {
		SocketService.emitToAdmins("surveillance:fraud_flag", payload);
		SocketService.emitToAdmins("order:updated", payload);
	}
}

export const adminSocketSubscriber = new AdminSocketSubscriber();

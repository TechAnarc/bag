import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { EventEnvelope } from "../../core/events/event-bus.interface";

export class OrderProjection {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		// We use subscribeWithEnvelope to get tenantId and tracking info
		eventBus.subscribeWithEnvelope(
			DomainEvent.ORDER_CREATED,
			this.projectOrderCreated.bind(this),
		);
		eventBus.subscribeWithEnvelope(
			DomainEvent.ORDER_COMPLETED,
			this.projectOrderUpdated.bind(this),
		);
		eventBus.subscribeWithEnvelope(
			DomainEvent.ORDER_CANCELLED,
			this.projectOrderUpdated.bind(this),
		);
		eventBus.subscribeWithEnvelope(
			DomainEvent.SLA_BREACHED,
			this.projectOrderUpdated.bind(this),
		);
	}

	private async projectOrderCreated(envelope: EventEnvelope) {
		const order = envelope.payload;
		logger.info(
			`[Projection] Syncing read model for new order ${order.orderNumber}`,
		);

		try {
			await prisma.orderReadModel.upsert({
				where: { orderNumber: order.orderNumber },
				update: {
					status: order.status,
					paymentStatus: order.paymentStatus,
					lastEventTitle: "Order Created",
					updatedAt: new Date(),
				},
				create: {
					tenantId: envelope.tenantId || "DEFAULT",
					orderNumber: order.orderNumber,
					customerName: order.user?.name || "Guest",
					customerEmail: order.user?.email || "N/A",
					totalAmount: order.total,
					status: order.status,
					paymentStatus: order.paymentStatus,
					itemCount: order.items?.length || 0,
					lastEventTitle: "Order Created",
					isEscalated: order.isEscalated || false,
					isFlagged: order.isFlagged || false,
					createdAt: order.createdAt || new Date(),
				},
			});
		} catch (error: any) {
			logger.error(
				`[Projection] Failed to project order ${order.orderNumber}: ${error.message}`,
			);
		}
	}

	private async projectOrderUpdated(envelope: EventEnvelope) {
		const order = envelope.payload;
		logger.info(
			`[Projection] Updating read model for order ${order.orderNumber}`,
		);

		const eventTitles: Record<string, string> = {
			[DomainEvent.ORDER_PROCESSING]: "Approved",
			[DomainEvent.ORDER_PACKED]: "Packed",
			[DomainEvent.ORDER_SHIPPED]: "Shipped",
			[DomainEvent.SLA_BREACHED]: "SLA Breached",
			[DomainEvent.ORDER_CANCELLED]: "Cancelled",
			[DomainEvent.ORDER_COMPLETED]: "Completed",
		};

		try {
			await prisma.orderReadModel.update({
				where: { orderNumber: order.orderNumber },
				data: {
					status: order.status,
					paymentStatus: order.paymentStatus,
					isEscalated: order.isEscalated || false,
					isFlagged: order.isFlagged || false,
					lastEventTitle: eventTitles[envelope.eventType] || "Updated",
					updatedAt: new Date(),
				},
			});
		} catch (error: any) {
			logger.warn(
				`[Projection] Read model update skipped for ${order.orderNumber} (might not exist yet)`,
			);
		}
	}
}

export const orderProjection = new OrderProjection();

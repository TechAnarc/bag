import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { mailService } from "../mail/mail.service";
import { prisma } from "../../config/database";

export class OrderListeners {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		eventBus.subscribe(
			DomainEvent.ORDER_CREATED,
			this.handleOrderCreated.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.PAYMENT_CONFIRMED,
			this.handlePaymentConfirmed.bind(this),
		);
		// We can subscribe to other events like SHIPPED, DELIVERED etc. in the future
	}

	private async handleOrderCreated(order: any) {
		logger.info(`[OrderListeners] Handling ORDER_CREATED for ${order.id}`);
		try {
			const user = await prisma.user.findUnique({
				where: { id: order.userId },
			});
			if (!user) {
				logger.warn(`[OrderListeners] User not found for order ${order.id}`);
				return;
			}

			// Enhanced order object with user name for the email template
			const enrichedOrder = { ...order, user: { name: user.name } };

			await mailService.sendOrderConfirmation(enrichedOrder, user.email);
			logger.info(
				`[OrderListeners] Order confirmation email sent to ${user.email}`,
			);
		} catch (error) {
			logger.error(
				`[OrderListeners] Failed to send order confirmation email:`,
				error,
			);
		}
	}

	private async handlePaymentConfirmed(order: any) {
		logger.info(`[OrderListeners] Handling PAYMENT_CONFIRMED for ${order.id}`);
		try {
			const user = await prisma.user.findUnique({
				where: { id: order.userId },
			});
			if (!user) {
				logger.warn(`[OrderListeners] User not found for order ${order.id}`);
				return;
			}

			// Should fetch latest order state to ensure we have all details
			const freshOrder = await prisma.order.findUnique({
				where: { id: order.id },
				include: {
					items: { include: { product: true } },
				},
			});

			if (!freshOrder) return;

			// Enhanced order object with user name for the email template
			const enrichedOrder = { ...freshOrder, user: { name: user.name } };

			await mailService.sendInvoice(enrichedOrder, user.email);
			logger.info(`[OrderListeners] Invoice email sent to ${user.email}`);
		} catch (error) {
			logger.error(`[OrderListeners] Failed to send invoice email:`, error);
		}
	}
}

export const orderListeners = new OrderListeners();

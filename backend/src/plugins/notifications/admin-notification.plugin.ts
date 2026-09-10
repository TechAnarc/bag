import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { notificationService } from "../../modules/notifications/notification.service";
import { logger } from "../../config/logger";

export class AdminNotificationPlugin {
	async init() {
		logger.info(
			"[AdminNotificationPlugin] Initializing Admin Notification Plugin...",
		);

		// 1. Order Notifications
		eventBus.subscribe(DomainEvent.ORDER_CREATED, async (order: any) => {
			await notificationService.notifyAdmins("ORDER_RECEIVED", {
				orderNumber: order.orderNumber,
				amount: order.total,
				customerName: order.user?.name || "Guest",
			});
		});

		// 2. Review Notifications
		eventBus.subscribe(DomainEvent.REVIEW_SUBMITTED, async (review: any) => {
			await notificationService.notifyAdmins("NEW_REVIEW", {
				productName: review.product?.name || "Product",
				rating: review.rating,
				author: review.name,
			});
		});

		// 3. Inquiry Notifications
		eventBus.subscribe(DomainEvent.INQUIRY_SUBMITTED, async (inquiry: any) => {
			await notificationService.notifyAdmins("NEW_INQUIRY", {
				subject: inquiry.subject || "New Contact Request",
				sender: inquiry.name,
				message: inquiry.message?.substring(0, 50) + "...",
			});
		});

		logger.info(
			"[AdminNotificationPlugin] Subscribed to critical admin events.",
		);
	}
}

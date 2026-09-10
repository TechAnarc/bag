import { Express } from "express";
import { IPlugin } from "../../core/plugins/plugin-manager";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { prisma } from "../../config/database";

export class LoyaltyPlugin implements IPlugin {
	name = "LoyaltySystem";
	version = "1.0.0";

	async initialize(app: Express) {
		logger.info("[LoyaltyPlugin] Initializing loyalty rewards logic...");

		// Subscribe to successful orders to grant points
		eventBus.subscribe(
			DomainEvent.ORDER_COMPLETED,
			this.grantLoyaltyPoints.bind(this),
		);

		// Register a plugin-specific route
		app.get("/api/v1/plugins/loyalty/balance/:userId", async (req, res) => {
			const { userId } = req.params;
			// In a real system, points would be in a separate table or metadata
			res.json({ userId, points: 150, tier: "GOLD" });
		});
	}

	private async grantLoyaltyPoints(order: any) {
		const points = Math.floor(order.total / 100);
		logger.info(
			`[LoyaltyPlugin] Granting ${points} points to user ${order.userId} for order ${order.orderNumber}`,
		);

		// This is where points would be persisted
	}
}

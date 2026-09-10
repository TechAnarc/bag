import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";

export class FraudService {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		eventBus.subscribe(DomainEvent.ORDER_CREATED, this.screenOrder.bind(this));
	}

	private async screenOrder(order: any) {
		logger.info(`[Fraud] Screening order ${order.orderNumber}`);

		let fraudScore = 0;
		const reasons: string[] = [];

		// Rule 1: High value COD
		if (order.paymentMethod === "COD" && order.total > 50000) {
			fraudScore += 50;
			reasons.push("High value COD order");
		}

		// Rule 2: Repeated orders from same user in short time
		const recentOrders = await prisma.order.count({
			where: {
				userId: order.userId,
				createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
			},
		});

		if (recentOrders > 3) {
			fraudScore += 30;
			reasons.push("Multiple orders in 24h");
		}

		// Rule 3: Check for suspicious email patterns (simplified)
		if (order.user?.email?.match(/temp|trash|mailinator/i)) {
			fraudScore += 40;
			reasons.push("Suspicious email domain");
		}

		if (fraudScore >= 40) {
			logger.warn(
				`[Fraud] Order ${order.orderNumber} flagged! Score: ${fraudScore}`,
			);

			await (prisma.order as any).update({
				where: { id: order.id },
				data: {
					isFlagged: true,
					fraudScore,
					riskLevel: fraudScore > 70 ? "HIGH" : "MEDIUM",
				},
			});

			await prisma.orderTimelineEvent.create({
				data: {
					orderId: order.id,
					status: order.status,
					title: "Fraud Screening Flag",
					description: `Order flagged by AI: ${reasons.join(", ")}`,
					actor: "SYSTEM",
				},
			});
		}
	}
}

export const fraudService = new FraudService();

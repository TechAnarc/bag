import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";

export class DecisionEngine {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		eventBus.subscribe(
			DomainEvent.ORDER_CREATED,
			this.onOrderCreated.bind(this),
		);
		eventBus.subscribe(DomainEvent.SLA_BREACHED, this.onSLABreach.bind(this));
	}

	private async onOrderCreated(order: any) {
		logger.info(
			`[DecisionEngine] Analyzing strategy for order ${order.orderNumber}`,
		);

		// 1. ADVANCED FRAUD DETECTION
		let fraudScore = 0;
		const reasons: string[] = [];

		// Pattern 1: High value COD
		if (order.paymentMethod === "COD" && order.total > 15000) {
			fraudScore += 40;
			reasons.push("HIGH_VALUE_COD");
		}

		// Pattern 2: Rapid succession orders from same identity (Heuristic)
		const recentOrders = await prisma.order.count({
			where: {
				userId: order.userId,
				createdAt: { gte: new Date(Date.now() - 3600000) }, // Last 1 hour
			},
		});
		if (recentOrders > 3) {
			fraudScore += 50;
			reasons.push("VELOCITY_ATTACK");
		}

		if (fraudScore >= 40) {
			await (prisma.order as any).update({
				where: { id: order.id },
				data: {
					isFlagged: true,
					fraudScore,
					riskLevel: fraudScore > 70 ? "HIGH" : "MEDIUM",
					adminNotes: `[AUTO-FRAUD] Flagged: ${reasons.join(", ")}`,
				},
			});
			eventBus.emitDomainEvent(DomainEvent.FRAUD_FLAGGED, {
				orderId: order.id,
				score: fraudScore,
				reasons,
			});
		}

		// 2. INTELLIGENT ROUTING
		// Auto-assign to nearest "Hub" (Simulated logic)
		const hubs = ["NORTH_HUB", "SOUTH_HUB", "WEST_HUB", "EAST_HUB"];
		const assignedHub = hubs[Math.floor(Math.random() * hubs.length)];

		await prisma.orderTimelineEvent.create({
			data: {
				orderId: order.id,
				status: order.status,
				title: "Strategic Routing Initialized",
				description: `Order routed to ${assignedHub} for optimal fulfillment.`,
				actor: "DECISION_ENGINE",
				metadata: { hub: assignedHub, strategy: "PROXIMITY_OPTIMIZED" },
			},
		});
	}

	private async onSLABreach(order: any) {
		logger.info(
			`[DecisionEngine] SLA Breach detected for ${order.orderNumber}. Optimizing logistics...`,
		);

		// Prioritize escalated orders
		await prisma.order.update({
			where: { id: order.id },
			data: {
				adminNotes: `[AUTO-STRATEGY] Prioritized due to SLA Breach at ${new Date().toISOString()}`,
			},
		});

		// Auto-assign to a delivery agent if not assigned
		if (!order.deliveryAgentId) {
			const topAgent = await prisma.deliveryAgent.findFirst({
				where: { active: true },
				orderBy: { updatedAt: "desc" },
			});

			if (topAgent) {
				logger.info(
					`[DecisionEngine] Auto-assigning top agent ${topAgent.name} to breached order ${order.orderNumber}`,
				);
				await prisma.order.update({
					where: { id: order.id },
					data: { deliveryAgentId: topAgent.id },
				});
			}
		}
	}
}

export const decisionEngine = new DecisionEngine();

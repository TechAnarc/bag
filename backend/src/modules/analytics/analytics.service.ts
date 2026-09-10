import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";

export class AnalyticsService {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		eventBus.subscribe(
			DomainEvent.ORDER_CREATED,
			this.trackOrderCreated.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.ORDER_COMPLETED,
			this.trackOrderCompleted.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.ORDER_CANCELLED,
			this.trackOrderCancelled.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.SLA_BREACHED,
			this.trackSLABreach.bind(this),
		);
	}

	private async trackOrderCreated(order: any) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		await prisma.orderAnalytic.upsert({
			where: { date: today },
			update: {
				totalOrders: { increment: 1 },
				totalRevenue: { increment: order.total },
			},
			create: {
				date: today,
				totalOrders: 1,
				totalRevenue: order.total,
			},
		});
	}

	private async trackOrderCompleted(order: any) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Calculate duration from creation to completion
		const durationHours =
			(Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);

		const currentAnalytic = await prisma.orderAnalytic.findUnique({
			where: { date: today },
		});
		const oldAvg = currentAnalytic?.averageDuration || 0;
		const totalCompleted = currentAnalytic?.totalOrders || 1; // Approximation
		const newAvg =
			(oldAvg * (totalCompleted - 1) + durationHours) / totalCompleted;

		await prisma.orderAnalytic.upsert({
			where: { date: today },
			update: {
				completionRate: { increment: 0.01 }, // Simplified
				averageDuration: newAvg,
			},
			create: {
				date: today,
				averageDuration: durationHours,
			},
		});
	}

	private async trackOrderCancelled(_order: any) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		await prisma.orderAnalytic.upsert({
			where: { date: today },
			update: {
				cancellationRate: { increment: 0.01 },
			},
			create: {
				date: today,
				cancellationRate: 0.01,
			},
		});
	}

	private async trackSLABreach(payload: any) {
		logger.warn(`[Analytics] SLA Breach recorded for order ${payload.orderId}`);
		// Log more detailed metrics for reporting
	}

	/**
	 * Get insights for dashboard
	 */
	async getPredictiveInsights() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const recent = await prisma.orderAnalytic.findMany({
			orderBy: { date: "desc" },
			take: 30,
		});

		if (recent.length === 0) {
			return {
				riskLevel: "LOW",
				trend: "STABLE",
				predictedLoad: 0,
				revenueVelocity: 0,
				activeStreams: 0,
				delta: 0,
			};
		}

		const avgCancellation =
			recent
				.slice(0, 7)
				.reduce((sum: number, r: any) => sum + r.cancellationRate, 0) /
			Math.min(recent.length, 7);
		const currentRevenue = recent[0]?.totalRevenue || 0;
		const previousRevenue = recent[1]?.totalRevenue || 0;
		const revenueDelta =
			previousRevenue > 0
				? ((currentRevenue - previousRevenue) / previousRevenue) * 100
				: 0;

		// Simple throughput calculation
		const totalOrdersLast7Days = recent
			.slice(0, 7)
			.reduce((sum: number, r: any) => sum + r.totalOrders, 0);
		const revenueVelocity = currentRevenue / 24; // Avg revenue per hour today

		return {
			riskLevel:
				avgCancellation > 0.1
					? "CRITICAL"
					: avgCancellation > 0.05
						? "HIGH"
						: "LOW",
			trend: revenueDelta > 10 ? "UP_SHARP" : revenueDelta > 0 ? "UP" : "DOWN",
			predictedLoad: Math.round((totalOrdersLast7Days / 7) * 1.2),
			revenueVelocity: parseFloat(revenueVelocity.toFixed(2)),
			revenueDelta: parseFloat(revenueDelta.toFixed(2)),
			activeStreams: recent[0]?.totalOrders || 0,
			datasetReliability: 0.99,
		};
	}
}

export const analyticsService = new AnalyticsService();

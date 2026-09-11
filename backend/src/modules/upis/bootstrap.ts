import { prisma } from "../../config/database";
import { upisService } from "./upis.service";
import { logger } from "../../config/logger";

export async function bootstrapDigitalTwins() {
	logger.info("🧠 [UPIS]: Commencing Historical Data Reconciliation...");
	try {
		const users = await prisma.user.findMany({
			include: {
				intelligence: true,
				orders: {
					where: { paymentStatus: "COMPLETED" },
				},
			},
		});

		logger.info(`🧠 [UPIS]: Found ${users.length} system identities.`);

		let provisioned = 0;
		let synced = 0;

		for (const user of users) {
			let twin = user.intelligence;

			// 1. Auto-Provision Missing Twins
			if (!twin) {
				twin = await prisma.userIntelligence.create({
					data: {
						userId: user.id,
						lastActiveAt: user.lastLoginAt || user.createdAt,
					},
				});
				provisioned++;
			}

			// 2. Reconcile Historical Commerce Data
			const completedOrders = user.orders;
			const totalSpent = completedOrders.reduce(
				(sum, order) => sum + (order.total || 0),
				0,
			);
			const orderCount = completedOrders.length;
			const aov = orderCount > 0 ? totalSpent / orderCount : 0;
			const lastOrder =
				completedOrders.length > 0
					? completedOrders.sort(
							(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
						)[0]
					: null;

			// Deterministic Lifecycle
			let stage = "NEW";
			if (totalSpent > 10000) stage = "HIGH_VALUE";
			else if (orderCount > 3) stage = "LOYAL";
			else if (orderCount > 0) stage = "ACTIVE";

			await prisma.userIntelligence.update({
				where: { userId: user.id },
				data: {
					ltv: totalSpent,
					orderCount: orderCount,
					aov: aov,
					totalSpent: totalSpent,
					lastOrderAt: lastOrder ? lastOrder.createdAt : null,
					lifecycleStage: stage,
					conversionScore: orderCount > 0 ? 0.8 : 0.1, // Historical inference
					trustIndex: orderCount > 2 ? 0.9 : 0.6,
				},
			});
			synced++;
		}

		logger.info(
			`🧠 [UPIS]: Reconstruction Complete. Provisioned: ${provisioned}, Reconciled: ${synced}`,
		);
		return { provisioned, synced };
	} catch (error) {
		logger.error("❌ [UPIS]: Historical Reconstruction Pipeline Failed", error);
		throw error;
	}
}

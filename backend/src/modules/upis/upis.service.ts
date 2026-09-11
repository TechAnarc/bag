import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { EventEnvelope } from "../../core/events/event-bus.interface";
import { telemetryMonitor } from "./monitoring.service";

/**
 * TRIVENI-OS-1: UPIS (User Predictive Intelligence System)
 * The authoritative Digital Twin Engine.
 */
export class UPISService {
	constructor() {
		this.initializeEngine();
	}

	private initializeEngine() {
		logger.info("🧠 [UPIS]: Activating Digital Twin Engine...");

		// 1. Auth & Connectivity
		eventBus.subscribeWithEnvelope(DomainEvent.USER_LOGIN, (env) =>
			this.handleBehavioralEvent(env),
		);

		// 2. Intent & Commerce
		eventBus.subscribeWithEnvelope(DomainEvent.PRODUCT_VIEWED, (env) =>
			this.handleBehavioralEvent(env),
		);
		eventBus.subscribeWithEnvelope(DomainEvent.CART_UPDATED, (env) =>
			this.handleBehavioralEvent(env),
		);
		eventBus.subscribeWithEnvelope(DomainEvent.CHECKOUT_STARTED, (env) =>
			this.handleBehavioralEvent(env),
		);

		// 3. Transactions & Value
		eventBus.subscribeWithEnvelope(DomainEvent.ORDER_CREATED, (env) =>
			this.handleCommerceEvent(env),
		);
		eventBus.subscribeWithEnvelope(DomainEvent.ORDER_DELIVERED, (env) =>
			this.handleCommerceEvent(env),
		);
		eventBus.subscribeWithEnvelope(DomainEvent.ORDER_CANCELLED, (env) =>
			this.handleCommerceEvent(env),
		);

		// 4. Invoices & Ledger
		eventBus.subscribeWithEnvelope(DomainEvent.LEDGER_ENTRY_CREATED, (env) =>
			this.handleFinancialEvent(env),
		);

		// 5. System Health
		eventBus.subscribe("SYSTEM.HEARTBEAT" as any, () => {
			telemetryMonitor.registerHeartbeatSuccess();
		});
	}

	/**
	 * Handle Behavioral Events (Views, Carts, Logins)
	 */
	private async handleBehavioralEvent(envelope: EventEnvelope) {
		const rawId = envelope.payload.userId || envelope.actor;
		// Don't drop tracking even for guests, use visitorId as fallback if available
		const trackingId =
			rawId && rawId !== "SYSTEM" && rawId !== "GUEST"
				? rawId
				: envelope.payload.visitorId;

		if (!trackingId) return;

		try {
			// 1. RECORD to raw behavioral log (Decoupled from Database Relation)
			await prisma.behavioralEvent.create({
				data: {
					userId: trackingId.startsWith("guest_") ? null : trackingId, // Nullable in DB for non-users
					eventType: envelope.eventType,
					entityId:
						envelope.payload.productId ||
						envelope.payload.id ||
						envelope.payload.slug,
					entityType: envelope.payload.type || "UNKNOWN",
					payload: envelope.payload as any,
					metadata: {
						correlationId: envelope.correlationId,
						visitorId: envelope.payload.visitorId,
					} as any,
				},
			});

			// 2. TWIN AGGREGATION (Requires real database user)
			const isRealUser =
				!trackingId.startsWith("guest_") && trackingId !== "GUEST";
			if (!isRealUser) return; // Exit cleanly after logging for guests

			const twin = await this.getOrCreateTwin(trackingId);

			// Update Intelligence Primitives
			const updateData: any = {
				lastActiveAt: new Date(),
				sessionCount: {
					increment: envelope.eventType === DomainEvent.USER_LOGIN ? 1 : 0,
				},
				productViewsCount: {
					increment: envelope.eventType === DomainEvent.PRODUCT_VIEWED ? 1 : 0,
				},
				cartAdditions: {
					increment: envelope.eventType === DomainEvent.CART_UPDATED ? 1 : 0,
				},
				checkoutAttempts: {
					increment:
						envelope.eventType === DomainEvent.CHECKOUT_STARTED ? 1 : 0,
				},
			};

			await this.updateTwin(trackingId, updateData);
			await this.recalculateScores(trackingId);
		} catch (err) {
			logger.error(
				`[UPIS]: Failed to process behavioral event ${envelope.eventType}`,
				err,
			);
		}
	}

	/**
	 * Handle Commerce Events (Order Lifecycle)
	 */
	private async handleCommerceEvent(envelope: EventEnvelope) {
		const order = envelope.payload;
		const userId = order.userId;
		if (!userId) return;

		try {
			const stats = await prisma.order.aggregate({
				where: { userId, paymentStatus: "COMPLETED" },
				_sum: { total: true },
				_count: { id: true },
			});

			const totalSpent = stats._sum.total || 0;
			const orderCount = stats._count.id || 0;
			const aov = orderCount > 0 ? totalSpent / orderCount : 0;

			await this.updateTwin(userId, {
				ltv: totalSpent,
				aov,
				orderCount,
				lastOrderAt: order.createdAt,
			});

			await this.recalculateScores(userId);
		} catch (err) {
			logger.error(
				`[UPIS]: Failed to process commerce event ${envelope.eventType}`,
				err,
			);
		}
	}

	/**
	 * Handle Financial Events (Ledger, Refunds)
	 */
	private async handleFinancialEvent(envelope: EventEnvelope) {
		// Implementation for trust index updates based on refunds/disputes
	}

	/**
	 * 🔮 Vector 1 & 3: Predictive Intelligence & Intent Engine
	 * Computes advanced probability vectors (RFM Models) from raw digital lineage.
	 */
	private async recalculateScores(userId: string) {
		const twin = await prisma.userIntelligence.findUnique({
			where: { userId },
		});
		if (!twin) return;

		const now = Date.now();
		const daysSinceLastActive =
			(now - twin.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);

		// 1. 🔥 🧠 CHURN PREDICTION (Time-Based Cooling Decay)
		// Exponential scale based on inactivity threshold windows
		let churnScore = 0.05; // Baseline
		if (daysSinceLastActive > 60) churnScore = 0.95;
		else if (daysSinceLastActive > 30) churnScore = 0.8;
		else if (daysSinceLastActive > 14) churnScore = 0.4;
		else if (daysSinceLastActive > 7) churnScore = 0.2;

		// 2. 💎 📈 CONVERSION & PURCHASE PROBABILITY
		// Weighted formula: (Intent Frequency * Recency Coefficient)
		const viewCount = twin.productViewsCount || 1;
		const cartVelocity = (twin.cartAdditions || 0) / viewCount;
		const checkoutIntent =
			(twin.checkoutAttempts || 0) / (twin.cartAdditions || 1);

		// Direct formula capturing the descending funnel weightings
		let baseProbability = cartVelocity * 0.4 + checkoutIntent * 0.6;

		// Inject "Hot Lead" cooldown logic (Probability decays if they haven't been active in last 24h)
		const recencyMultiplier =
			daysSinceLastActive <= 1 ? 1.2 : daysSinceLastActive <= 3 ? 0.8 : 0.4;
		const conversionScore = Math.min(1.0, baseProbability * recencyMultiplier);

		// 3. 🚨 🛡️ RISK & FRAUD COEFFICIENT
		// Looks for extreme checkout anomalies (bots or stolen card test loops)
		const abanCheckouts = Math.max(0, twin.checkoutAttempts - twin.orderCount);
		let riskScore = 0.05;
		if (abanCheckouts > 10 && twin.orderCount === 0)
			riskScore = 0.9; // Bot pattern
		else if (abanCheckouts > 5) riskScore = 0.5;
		else if (twin.checkoutAttempts > twin.orderCount * 4) riskScore = 0.3;

		// 4. 🏷️ 🏆 DYNAMIC LIFECYCLE CLASSIFICATION (RFM Engine)
		let stage = "NEW";
		if (twin.ltv > 20000 || (twin.orderCount > 5 && twin.ltv > 10000)) {
			stage = "HIGH_VALUE";
		} else if (twin.orderCount > 3 && daysSinceLastActive <= 30) {
			stage = "LOYAL";
		} else if (twin.orderCount > 0 && daysSinceLastActive <= 60) {
			stage = "ACTIVE";
		} else if (twin.orderCount > 0 && daysSinceLastActive > 60) {
			stage = "AT_RISK"; // Automated Churn bucket
		} else if (twin.cartAdditions > 0 || twin.checkoutAttempts > 0) {
			stage = "INTERESTED"; // Pre-sale high-intent funnel
		} else if (twin.productViewsCount > 3) {
			stage = "CURIOUS";
		}

		// Save Computed Probability Vectors
		const updatedTwin = await this.updateTwin(userId, {
			churnScore,
			conversionScore,
			riskScore,
			lifecycleStage: stage,
			confidenceBands: {
				v1_recency: daysSinceLastActive,
				v1_velocity: cartVelocity,
				v1_conversion: checkoutIntent,
			} as any,
		});

		logger.debug(
			`🔮 [UPIS:Compute] Recalibrated vectors for user ${userId}: Churn=${churnScore.toFixed(2)}, Conv=${conversionScore.toFixed(2)}`,
		);

		// 🚨 Vector 7: Autonomous Orchestration Trigger
		// Evaluate automated rules against newly synthesized profile
		import("./automation/engine")
			.then(({ ruleEngine }) => {
				ruleEngine.evaluate(userId, updatedTwin);
			})
			.catch((e) => logger.error("Failed to load rule engine", e));
	}

	/**
	 * Public accessor: ensure a twin record exists for a user
	 */
	async ensureTwinExists(userId: string) {
		return this.getOrCreateTwin(userId);
	}

	private async getOrCreateTwin(userId: string) {
		let twin = await prisma.userIntelligence.findUnique({
			where: { userId },
		});
		if (!twin) {
			twin = await prisma.userIntelligence.create({
				data: { userId },
			});
		}
		return twin;
	}

	private async updateTwin(userId: string, data: any) {
		return prisma.userIntelligence.update({
			where: { userId },
			data,
		});
	}

	/**
	 * Get Customer 360 View
	 */
	async getCustomer360(userId: string) {
		const [twin, user, recentEvents] = await Promise.all([
			prisma.userIntelligence.findUnique({ where: { userId } }),
			(prisma.user as any).findUnique({
				where: { id: userId },
				include: { profile: true },
			}),
			prisma.behavioralEvent.findMany({
				where: { userId },
				orderBy: { occurredAt: "desc" },
				take: 50,
			}),
		]);

		return {
			twin,
			identity: user,
			timeline: recentEvents,
		};
	}
	/**
	 * 🧬 Vector 5: Identity Fusion Engine
	 * Merges anonymous historical behavior into an authenticated user profile upon login/registration.
	 */
	async fuseIdentity(visitorId: string, userId: string) {
		if (!visitorId || !userId || visitorId === userId) return;

		logger.info(
			`🧬 [UPIS] Initiating Identity Fusion: ${visitorId} -> ${userId}`,
		);

		try {
			// 1. Patch historical logs to the new definitive identity
			const updateResult = await prisma.behavioralEvent.updateMany({
				where: {
					userId: null,
					OR: [
						{ metadata: { path: ["visitorId"], equals: visitorId } },
						// Fallback for safety if structured differently
						{ payload: { path: ["visitorId"], equals: visitorId } },
					],
				},
				data: {
					userId: userId,
				},
			});

			logger.info(
				`🧬 [UPIS] Successfully fused ${updateResult.count} behavioral records.`,
			);

			if (updateResult.count === 0) return; // Nothing to merge

			// 2. Recompute historical counts
			const allEvents = await prisma.behavioralEvent.findMany({
				where: { userId: userId },
				select: { eventType: true },
			});

			// Sum all instances to restore total digital lineage
			const productViews = allEvents.filter(
				(e: any) => e.eventType === DomainEvent.PRODUCT_VIEWED,
			).length;
			const cartAdds = allEvents.filter(
				(e: any) => e.eventType === DomainEvent.CART_UPDATED,
			).length;
			const checkoutStarts = allEvents.filter(
				(e: any) => e.eventType === DomainEvent.CHECKOUT_STARTED,
			).length;

			// 3. Ensure twin exists prior to updating (critical for new provisioned users!)
			await this.getOrCreateTwin(userId);

			await this.updateTwin(userId, {
				productViewsCount: productViews,
				cartAdditions: cartAdds,
				checkoutAttempts: checkoutStarts,
			});

			// 4. Run predictive models against the fully merged dataset
			await this.recalculateScores(userId);

			logger.info(
				`🧬 [UPIS] Identity Fusion Complete for ${userId}. Engine recalibrated.`,
			);
		} catch (error) {
			logger.error("❌ [UPIS] Identity Fusion Pipeline Collapse", error);
		}
	}
}

export const upisService = new UPISService();

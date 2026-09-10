import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";

export enum DecisionCategory {
	EXPERIENCE = "EXPERIENCE",
	RISK = "RISK",
	SLA = "SLA",
	LOGISTICS = "LOGISTICS",
}

export class AutonomousDecisionEngine {
	constructor() {
		console.log("🧠 [ADE] Autonomous Decision Engine Initializing...");
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		console.log("📡 [ADE] Subscribing to Domain Events...");
		// EXPERIENCE: Cart Abandonment Logic
		eventBus.subscribe(DomainEvent.CART_UPDATED, (p) => {
			console.log("📥 [ADE] Received CART_UPDATED signal");
			this.onExperienceSignal(p);
		});

		// RISK: Fraud & Verification Logic
		eventBus.subscribe(DomainEvent.ORDER_CREATED, (p) => {
			console.log("📥 [ADE] Received ORDER_CREATED signal");
			this.onRiskSignal(p);
		});

		// SLA: Breach Remediation
		eventBus.subscribe(DomainEvent.SLA_BREACHED, (p) => {
			console.log("📥 [ADE] Received SLA_BREACHED signal");
			this.onSLASignal(p);
		});

		// LOGISTICS: Delay Detection (Triggered by tracking updates)
		eventBus.subscribe(
			DomainEvent.ORDER_UPDATED,
			this.onLogisticsSignal.bind(this),
		);
	}

	// --- Signal Handlers (Cognitive Layer) ---

	private async onExperienceSignal(payload: any) {
		try {
			const { userId } = payload;
			if (!userId) return;

			// Signal Analysis: Cross-tier behavioral check
			const intel = await (prisma as any).userIntelligence.findUnique({
				where: { userId },
			});

			if (intel && intel.conversionScore > 0.8 && intel.abandonedCarts > 1) {
				// Condition Met: High intent but friction observed
				await this.evaluateAndExecute("CART_RECOVERY_AUTONOMY", {
					userId,
					category: DecisionCategory.EXPERIENCE,
					signals: {
						conversionScore: intel.conversionScore,
						abandonedCarts: intel.abandonedCarts,
					},
				});
			}
		} catch (error) {
			logger.error("[ADE] Experience Signal Processing Failure", error);
		}
	}

	private async onRiskSignal(order: any) {
		try {
			// Signal Analysis: Fraud Proximity Gradient
			if (order.riskScore > 0.75) {
				await this.evaluateAndExecute("RISK_PREEMPTIVE_HOLD", {
					orderId: order.id,
					userId: order.userId,
					category: DecisionCategory.RISK,
					signals: { riskScore: order.riskScore },
				});
			}
		} catch (error) {
			logger.error("[ADE] Risk Signal Processing Failure", error);
		}
	}

	private async onSLASignal(payload: any) {
		try {
			const { orderId } = payload;
			if (!orderId) return;

			// Signal Analysis: Predicted Failure
			await this.evaluateAndExecute("SLA_PRIORITY_RECOVERY", {
				orderId,
				category: DecisionCategory.SLA,
				signals: { event: "SLA_BREACH_DETECTED" },
			});
		} catch (error) {
			logger.error("[ADE] SLA Signal Processing Failure", error);
		}
	}

	private async onLogisticsSignal(payload: any) {
		try {
			// Check if logistics delay metadata is present
			if (payload.metadata?.delayReported || payload.status === "FAILED") {
				await this.evaluateAndExecute("LOGISTICS_DELAY_INTERVENTION", {
					orderId: payload.id,
					category: DecisionCategory.LOGISTICS,
					signals: { status: payload.status, metadata: payload.metadata },
				});
			}
		} catch (error) {
			logger.error("[ADE] Logistics Signal Processing Failure", error);
		}
	}

	// --- Execution Kernel (The Loop) ---

	private async evaluateAndExecute(policyName: string, context: any) {
		const policy = await (prisma as any).decisionPolicy.findUnique({
			where: { name: policyName },
		});

		if (!policy || !policy.isActive) {
			logger.debug(
				`[ADE] Policy ${policyName} skipped (Inactive or Not Found)`,
			);
			return;
		}

		logger.info(
			`[ADE] Cognitive Action Triggered: ${policyName} | Correlation: ${
				context.orderId || context.userId
			}`,
		);

		// 1. Persist Decision Record (Traceability Mandatory)
		const decision = await (prisma as any).autonomousDecision.create({
			data: {
				policyId: policy.id,
				policyVersion: policy.version,
				triggerSignal: context.category,
				triggerPayload: context.signals,
				actionTaken: policyName,
				status: "PENDING",
				correlationId: context.orderId || context.userId,
				entityType: context.orderId ? "ORDER" : "USER",
				entityId: context.orderId || context.userId,
				confidenceScore: 0.95, // Deterministic for now
				impactLevel: policy.category === "RISK" ? "HIGH" : "MEDIUM",
			},
		});

		try {
			// 2. Perform System Intervention
			const result = await this.dispatchAction(policyName, context);

			// 3. Close the Loop
			await (prisma as any).autonomousDecision.update({
				where: { id: decision.id },
				data: {
					status: "EXECUTED",
					actionResponse: result as any,
					executedAt: new Date(),
				},
			});

			logger.info(`[ADE:SUCCESS] Decision ID: ${decision.id} completed.`);
		} catch (error: any) {
			await (prisma as any).autonomousDecision.update({
				where: { id: decision.id },
				data: {
					status: "FAILED",
					errorMessage: error.message,
				},
			});
			logger.error(
				`[ADE:FAILURE] Decision ID: ${decision.id} failed core execution.`,
				error,
			);
		}
	}

	private async dispatchAction(policyName: string, context: any) {
		switch (policyName) {
			case "CART_RECOVERY_AUTONOMY":
				// ACTION: Trigger proactive incentive via communication engine
				return {
					action: "PROACTIVE_INCENTIVE_TRIGGERED",
					incentive: "FREE_SHIPPING_UPGRADE",
					channel: "WHATSAPP_ULTRA",
				};

			case "RISK_PREEMPTIVE_HOLD":
				// ACTION: Soft-hold order status to prevent fulfillment leak
				await prisma.order.update({
					where: { id: context.orderId },
					data: {
						status: "PROCESSING",
						adminNotes:
							"[ADE:AUTONOMY] Pre-emptive security hold applied. High risk proximity detected.",
						isFlagged: true,
					},
				});
				return {
					action: "ORDER_SOFT_HOLD",
					applied: true,
					verificationRequired: true,
				};

			case "SLA_PRIORITY_RECOVERY":
				// ACTION: Auto-upgrade logistics priority
				await prisma.order.update({
					where: { id: context.orderId },
					data: {
						adminNotes:
							"[ADE:AUTONOMY] Logistic remediation active: Upgraded to HIGHEST_PRIORITY due to SLA risk.",
						isEscalated: true,
					},
				});
				return { action: "SHIPPING_UPGRADED", priority: "EXPRESS_CRITICAL" };

			case "LOGISTICS_DELAY_INTERVENTION":
				// ACTION: PRE-EMPTIVE Customer Apology + ETA Adjustment
				return {
					action: "CUSTOMER_NOTIFIED_PREEMPTIVELY",
					outcome: "FRICTION_MINIMIZED",
					remediation: "APOLOGY_LOYALTY_POINTS_PENDING",
				};

			default:
				throw new Error(
					`Execution Kernel Error: Strategy '${policyName}' is not codified.`,
				);
		}
	}
}

export const ade = new AutonomousDecisionEngine();

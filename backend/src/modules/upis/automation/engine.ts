import { logger } from "../../../config/logger";

/**
 * 🚨 Phase 7: Future Automation Interfaces
 * Definitive architectural boundaries for Autonomous Action Protocols.
 */

export type TriggerCondition =
	| "CHURN_RISK_ABOVE"
	| "CONVERSION_LIKELIHOOD_ABOVE"
	| "HIGH_VALUE_DETECTED"
	| "IDLE_DWELL_TIME";

export interface RuleDefinition {
	id: string;
	name: string;
	trigger: TriggerCondition;
	threshold: number;
	actionType: "WEBHOOK" | "NOTIFICATION" | "COUPON_GEN";
	enabled: boolean;
}

export interface ActionPayload {
	userId: string;
	twinContext: any;
	timestamp: Date;
}

/**
 * The core bus designed for plug-and-play action executors.
 */
export class AutomationActionBus {
	public static async dispatch(actionType: string, payload: ActionPayload) {
		logger.info(
			`🚨 [UPIS:Automation] Dispatching action: ${actionType} for subject ${payload.userId}`,
		);

		// Placeholder architecture for future extensible executors
		switch (actionType) {
			case "WEBHOOK":
				// Future: trigger external webhook (Zapier, Concierge)
				return;
			case "NOTIFICATION":
				// Future: dispatch push via SocketService or SMS
				return;
			case "COUPON_GEN":
				// Future: create dynamic promotional code
				return;
			default:
				logger.warn(`⚠️ Unhandled action type queued: ${actionType}`);
		}
	}
}

/**
 * Decoupled Rules Engine which compares twin states to active protocols.
 */
export class UpisRuleEngine {
	private rules: RuleDefinition[] = [
		{
			id: "1",
			name: "High Risk Churn Alert",
			trigger: "CHURN_RISK_ABOVE",
			threshold: 0.8,
			actionType: "NOTIFICATION",
			enabled: true,
		},
		{
			id: "2",
			name: "Flash VIP Offer",
			trigger: "CONVERSION_LIKELIHOOD_ABOVE",
			threshold: 0.7,
			actionType: "COUPON_GEN",
			enabled: false,
		},
	];

	public evaluate(userId: string, twin: any) {
		logger.debug(
			`🤖 [UPIS:RulesEngine] Scanning conditions for subject ${userId}`,
		);

		for (const rule of this.rules) {
			if (!rule.enabled) continue;

			let triggered = false;

			if (
				rule.trigger === "CHURN_RISK_ABOVE" &&
				twin.churnScore > rule.threshold
			) {
				triggered = true;
			} else if (
				rule.trigger === "CONVERSION_LIKELIHOOD_ABOVE" &&
				twin.conversionScore > rule.threshold
			) {
				triggered = true;
			}

			if (triggered) {
				logger.info(
					`🚨 [UPIS:RulesEngine] ✅ Rule MATCHED: "${rule.name}" for user ${userId}`,
				);

				// Queue Action execution asynchronously
				AutomationActionBus.dispatch(rule.actionType, {
					userId,
					twinContext: twin,
					timestamp: new Date(),
				}).catch((e) =>
					logger.error("[UPIS:RulesEngine] Action Dispatch Failed", e),
				);
			}
		}
	}
}

export const ruleEngine = new UpisRuleEngine();

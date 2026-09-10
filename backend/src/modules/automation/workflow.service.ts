import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import {
	notificationService,
	NotificationPlatform,
} from "../notifications/notification.service";
import axios from "axios";

export class WorkflowService {
	constructor() {
		this.initializeListeners();
	}

	private initializeListeners() {
		// Listen to all domain events to check for matching workflows
		Object.values(DomainEvent).forEach((event) => {
			eventBus.subscribe(event as DomainEvent, (payload) =>
				this.executeWorkflows(event, payload),
			);
		});
	}

	private async executeWorkflows(eventName: string, payload: any) {
		try {
			const rules = await prisma.workflowRule.findMany({
				where: { triggerEvent: eventName, isActive: true },
				orderBy: { priority: "desc" },
			});

			for (const rule of rules) {
				if (this.evaluateConditions(rule.conditions, payload)) {
					await this.runActions(rule.actions as any, payload);
				}
			}
		} catch (error: any) {
			logger.error(
				`[Workflow] Error executing workflows for ${eventName}: ${error.message}`,
			);
		}
	}

	private evaluateConditions(conditions: any, payload: any): boolean {
		if (!conditions) return true;

		// Simple heuristic condition evaluator
		// Example: { "total": { ">": 5000 } }
		try {
			for (const key in conditions) {
				const criteria = conditions[key];
				const value = payload[key];

				if (criteria[">"] !== undefined && value <= criteria[">"]) return false;
				if (criteria["<"] !== undefined && value >= criteria["<"]) return false;
				if (criteria["=="] !== undefined && value !== criteria["=="])
					return false;
			}
			return true;
		} catch (err) {
			logger.error(`[Workflow] Condition evaluation failed:`, err);
			return false;
		}
	}

	private async runActions(actions: any[], payload: any) {
		for (const action of actions) {
			switch (action.type) {
				case "NOTIFICATION":
					await notificationService.send({
						to: payload.user?.email || payload.email,
						templateName: action.template,
						params: payload,
						platform: action.platform as NotificationPlatform,
					});
					break;

				case "WEBHOOK":
					await this.triggerWebhook(action.url, payload);
					break;

				case "AUTO_STATUS":
					// We'd call OrderService.updateOrderStatus here
					// To avoid circular dependency, we emit another event or use a command pattern
					logger.info(
						`[Workflow] Auto-triggering status change to ${action.status}`,
					);
					break;

				default:
					logger.warn(`[Workflow] Unknown action type: ${action.type}`);
			}
		}
	}

	private async triggerWebhook(url: string, payload: any) {
		try {
			await axios.post(url, payload, { timeout: 5000 });
			logger.info(`[Workflow] Webhook delivered to ${url}`);
		} catch (err: any) {
			logger.warn(`[Workflow] Webhook failed to ${url}: ${err.message}`);
		}
	}
}

export const workflowService = new WorkflowService();

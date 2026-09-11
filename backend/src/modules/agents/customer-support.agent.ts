import { prisma } from "../../config/database";
import { DomainEvent, eventBus } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { agentsRepository } from "./agents.repository";
import { AgentMessageKind, AgentMessageRole, AgentType } from "@prisma/client";
import {
	AgentAnswerPayload,
	AgentQueryPayload,
	CustomerAgentContext,
	AgentReasoningStep,
} from "./agents.types";

export class CustomerSupportAgent {
	async handleQuery(
		sessionId: string,
		context: CustomerAgentContext,
		payload: AgentQueryPayload,
	): Promise<{ answer: AgentAnswerPayload; reasoning: AgentReasoningStep[] }> {
		const normalized = payload.question.toLowerCase();

		// 1. Grounding anchor: fetch latest order if none specified
		const order = context.orderId
			? await prisma.order.findUnique({
					where: { id: context.orderId },
					include: { items: { include: { product: true } } },
				})
			: await prisma.order.findFirst({
					where: { userId: context.userId },
					orderBy: { createdAt: "desc" },
					include: { items: { include: { product: true } } },
				});

		if (!order) {
			const answer: AgentAnswerPayload = {
				answer:
					"I’m not seeing any orders linked to your profile yet. Once you place an order, I’ll be able to track it for you in real-time.",
				summary: "No orders found for this profile.",
				confidence: 0.98,
			};

			await agentsRepository.appendMessage({
				sessionId,
				role: AgentMessageRole.AGENT,
				kind: AgentMessageKind.ANSWER,
				content: answer.answer,
				payload: answer,
			});

			return {
				answer,
				reasoning: [
					{
						id: "no-orders",
						label: "Order lookup",
						description:
							"Queried orders for the current authenticated user. No records were returned.",
						groundedIn: [{ type: "USER", id: context.userId }],
					},
				],
			};
		}

		const reasoning: AgentReasoningStep[] = [];

		reasoning.push({
			id: "order-selected",
			label: "Order selection",
			description: `Selected order ${order.orderNumber || order.id} as the primary context for this conversation.`,
			groundedIn: [{ type: "ORDER", id: order.id }],
		});

		// 2. Read ADE decisions for this order
		const decisions = await prisma.autonomousDecision.findMany({
			where: {
				entityType: "ORDER",
				entityId: order.id,
			},
			orderBy: { createdAt: "desc" },
			take: 10,
		});

		if (decisions.length > 0) {
			reasoning.push({
				id: "ade-decisions",
				label: "Autonomy stream",
				description:
					"Fetched recent AutonomousDecision records associated with this order for delay, risk, and SLA context.",
				groundedIn: decisions.map((d: any) => ({
					type: "DECISION",
					id: d.id as string,
				})),
			});
		}

		// 3. Detect intent: tracking / delay / refund / invoice
		const intent = this.detectIntent(normalized);

		reasoning.push({
			id: "intent-detected",
			label: "Intent classification",
			description: `Classified the question as: ${intent}.`,
			groundedIn: [{ type: "ORDER", id: order.id }],
		});

		const answer = await this.composeAnswerForIntent(intent, order, decisions);

		await agentsRepository.appendMessage({
			sessionId,
			role: AgentMessageRole.AGENT,
			kind: AgentMessageKind.ANSWER,
			content: answer.answer,
			payload: answer,
		});

		// 4. Log structured reasoning
		await agentsRepository.appendMessage({
			sessionId,
			role: AgentMessageRole.SYSTEM,
			kind: AgentMessageKind.REASONING,
			content: "Structured reasoning trace for this interaction.",
			payload: reasoning,
		});

		// 5. Optional: Propose ADE follow-up action (non-executing)
		if (
			intent === "DELAY" &&
			order.status &&
			!["DELIVERED", "COMPLETED", "CANCELLED"].includes(order.status)
		) {
			await agentsRepository.createProposal({
				sessionId,
				agentType: AgentType.CUSTOMER_SUPPORT,
				targetEntityType: "ORDER",
				targetEntityId: order.id,
				suggestedAction: "REVIEW_SLA_AND_CONSIDER_PRIORITY_UPGRADE",
				rationale: {
					reason:
						"Customer expressed concern about delay; order is not yet delivered.",
					currentStatus: order.status,
				},
				confidenceScore: 0.85,
			});

			// Emit a non-blocking signal into the event fabric for ADE / admin
			await eventBus.emitDomainEvent(DomainEvent.SLA_BREACHED, {
				id: order.id,
				orderNumber: order.orderNumber,
			});
		}

		return { answer, reasoning };
	}

	private detectIntent(
		q: string,
	): "TRACKING" | "DELAY" | "REFUND" | "INVOICE" | "GENERIC" {
		if (q.includes("where") || q.includes("track") || q.includes("status")) {
			return "TRACKING";
		}
		if (q.includes("late") || q.includes("delay") || q.includes("delayed")) {
			return "DELAY";
		}
		if (
			q.includes("refund") ||
			q.includes("money back") ||
			q.includes("return")
		) {
			return "REFUND";
		}
		if (q.includes("invoice") || q.includes("bill") || q.includes("gst")) {
			return "INVOICE";
		}
		return "GENERIC";
	}

	private async composeAnswerForIntent(
		intent: ReturnType<CustomerSupportAgent["detectIntent"]>,
		order: any,
		decisions: any[],
	): Promise<AgentAnswerPayload> {
		const baseStatus = this.describeOrderStatus(order);
		const autonomySummary = this.describeAutonomy(decisions);

		switch (intent) {
			case "TRACKING":
				return {
					answer: `${baseStatus} ${autonomySummary}`,
					summary: "Explained current order status and active autonomy.",
					confidence: 0.97,
				};

			case "DELAY":
				return {
					answer: `${baseStatus} ${autonomySummary} If your order crosses its committed delivery window, the system will automatically escalate logistics priority and notify you—no extra action is needed from your side.`,
					summary: "Explained delay posture and upcoming interventions.",
					confidence: 0.95,
				};

			case "REFUND":
				return {
					answer:
						"Your order is protected by Bombay Bag House's standard refund and replacement policy. Once a refund is initiated from the order detail page, the system will track payment confirmation, ledger entry, and credit back to your original method. You can always see the live status under “My Orders → Order Details → Refund Timeline.”",
					summary: "Outlined how refunds are handled and surfaced.",
					confidence: 0.9,
				};

			case "INVOICE":
				return {
					answer:
						"A GST-compliant invoice is generated for every completed order. Once your order is marked as DELIVERED or COMPLETED, you can download the PDF invoice from the order detail screen. It includes QR-based authenticity, tax breakdown, and your billing information.",
					summary: "Described when and where invoices are available.",
					confidence: 0.9,
				};

			case "GENERIC":
			default:
				return {
					answer: `${baseStatus} ${autonomySummary}`,
					summary: "Provided a grounded overview of the order state.",
					confidence: 0.9,
				};
		}
	}

	private describeOrderStatus(order: any): string {
		const status = order.status || "PROCESSING";
		const carrier = order.carrier || "our logistics network";
		const tracking =
			order.trackingNumber ||
			"your secure tracking link in the order detail screen";

		return `Your order ${order.orderNumber || ""} is currently in the "${status}" state and is flowing through ${carrier}. You can always view its live path and event trail from the same tracking view you used to open this assistant. For security, tracking is bound to your account and exposed only through ${tracking}.`;
	}

	private describeAutonomy(decisions: any[]): string {
		if (!decisions || decisions.length === 0) {
			return "At the moment, there are no autonomous interventions recorded for this order—the system considers it to be progressing normally within its expected window.";
		}

		const latest = decisions[0];
		return `The Autonomous Decision Engine has already evaluated this order under the “${latest.actionTaken}” policy, with a confidence of ${(
			latest.confidenceScore || 1
		).toFixed(
			2,
		)}. Its actions and reasoning are fully logged and available to supervisors, so any future changes you see—such as priority upgrades or additional verification—come from that governed policy, not from ad-hoc manual changes.`;
	}
}

export const customerSupportAgent = new CustomerSupportAgent();

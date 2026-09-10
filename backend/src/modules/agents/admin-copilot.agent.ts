import { prisma } from "../../config/database";
import { agentsRepository } from "./agents.repository";
import { AgentMessageKind, AgentMessageRole, AgentType } from "@prisma/client";
import {
	AdminAgentContext,
	AgentAnswerPayload,
	AgentReasoningStep,
	AgentQueryPayload,
} from "./agents.types";

export class AdminCopilotAgent {
	async handleQuery(
		sessionId: string,
		context: AdminAgentContext,
		payload: AgentQueryPayload,
	): Promise<{ answer: AgentAnswerPayload; reasoning: AgentReasoningStep[] }> {
		const reasoning: AgentReasoningStep[] = [];

		// 1. Resolve order + autonomy stream
		const order = context.orderId
			? await prisma.order.findUnique({
					where: { id: context.orderId },
					include: { user: true },
				})
			: null;

		const decisions = await (prisma as any).autonomousDecision.findMany({
			where: {
				entityType: "ORDER",
				entityId: context.orderId ?? undefined,
			},
			include: {
				policy: true,
			},
			orderBy: { createdAt: "desc" },
			take: 20,
		});

		reasoning.push({
			id: "autonomy-context",
			label: "Autonomy context resolved",
			description:
				"Loaded the recent AutonomousDecision records and related policy metadata for the selected stream.",
			groundedIn: [
				...(order ? [{ type: "ORDER", id: order.id }] : []),
				...decisions.map((d: any) => ({
					type: "DECISION",
					id: d.id as string,
				})),
			],
		});

		const answer = this.composeExplanation(order, decisions);

		await agentsRepository.appendMessage({
			sessionId,
			role: AgentMessageRole.AGENT,
			kind: AgentMessageKind.ANSWER,
			content: answer.answer,
			payload: answer,
		});

		await agentsRepository.appendMessage({
			sessionId,
			role: AgentMessageRole.SYSTEM,
			kind: AgentMessageKind.REASONING,
			content: "Structured explanation trace for admin copilot.",
			payload: reasoning,
		});

		return { answer, reasoning };
	}

	private composeExplanation(
		order: any | null,
		decisions: any[],
	): AgentAnswerPayload {
		if (!order && decisions.length === 0) {
			return {
				answer:
					"I could not bind this question to a specific order or autonomy stream. From the telemetry I can see, there is no active AutonomousDecision record attached to this context yet.",
				summary: "No autonomy records bound to the current context.",
				confidence: 0.9,
			};
		}

		const latest = decisions[0];

		if (!latest) {
			return {
				answer:
					"This order is flowing through the commerce OS without any overrides or corrective policies fired yet. All state transitions you see are coming from standard workflow rules, not from the Autonomous Decision Engine.",
				summary: "Order currently governed by default workflow only.",
				confidence: 0.95,
			};
		}

		const policy = latest.policy;
		const base = [
			order
				? `Order ${order.orderNumber || order.id} is currently in state "${order.status}".`
				: "This stream is tied to an order whose base state has been resolved from the database.",
			`The last autonomous decision applied was "${latest.actionTaken}" under policy "${policy?.name || "Unknown Policy"}" (v${latest.policyVersion}).`,
			`Trigger signal: ${latest.triggerSignal}. Confidence score: ${(
				latest.confidenceScore || 1
			).toFixed(2)}. Impact level: ${latest.impactLevel}.`,
		];

		const governance = [
			latest.isOverridden
				? "This decision has already been overridden by a human supervisor. The override reason and actor are fully logged and available in the autonomy console."
				: "This decision has not been overridden. Any manual change you perform here will be logged as a governance event and fed back into the policy feedback pipeline.",
			"All thresholds and rule logic for this policy are versioned. When you tune them from the Autonomy Policy Console, every subsequent decision will carry the updated version for full traceability.",
		];

		return {
			answer: `${base.join(" ")} ${governance.join(" ")}`,
			summary:
				"Explained what the ADE did, under which policy, and how governance applies.",
			confidence: 0.97,
		};
	}
}

export const adminCopilotAgent = new AdminCopilotAgent();

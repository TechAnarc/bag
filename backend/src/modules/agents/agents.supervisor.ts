import { agentsRepository } from "./agents.repository";
import { customerSupportAgent } from "./customer-support.agent";
import { adminCopilotAgent } from "./admin-copilot.agent";
import { AgentType, AgentMessageRole, AgentMessageKind } from "@prisma/client";
import {
	AgentQueryPayload,
	CustomerAgentContext,
	AdminAgentContext,
} from "./agents.types";

export class AgentSupervisorService {
	async handleCustomerInteraction(params: {
		userId: string;
		tenantId?: string | null;
		orderId?: string | null;
		topic?: string | null;
		question: string;
	}) {
		const session = await agentsRepository.createSession({
			agentType: AgentType.CUSTOMER_SUPPORT,
			tenantId: params.tenantId,
			userId: params.userId,
			topic: params.topic ?? "ORDER",
			correlationId: params.orderId ?? params.userId,
		});

		await agentsRepository.appendMessage({
			sessionId: session.id,
			role: AgentMessageRole.USER,
			kind: AgentMessageKind.QUESTION,
			content: params.question,
			payload: { raw: params.question },
		});

		const context: CustomerAgentContext = {
			userId: params.userId,
			orderId: params.orderId ?? undefined,
			tenantId: params.tenantId ?? undefined,
			correlationId: params.orderId ?? params.userId,
		};

		const payload: AgentQueryPayload = {
			question: params.question,
			topic: params.topic ?? "ORDER",
		};

		const { answer, reasoning } = await customerSupportAgent.handleQuery(
			session.id,
			context,
			payload,
		);

		return {
			sessionId: session.id,
			answer,
			reasoning,
		};
	}

	async handleAdminInteraction(params: {
		adminId: string;
		tenantId?: string | null;
		orderId?: string | null;
		autonomousDecisionId?: string | null;
		topic?: string | null;
		question: string;
	}) {
		const session = await agentsRepository.createSession({
			agentType: AgentType.ADMIN_COPILOT,
			tenantId: params.tenantId,
			adminId: params.adminId,
			topic: params.topic ?? "AUTONOMY",
			correlationId:
				params.orderId ?? params.autonomousDecisionId ?? params.adminId,
		});

		await agentsRepository.appendMessage({
			sessionId: session.id,
			role: AgentMessageRole.USER,
			kind: AgentMessageKind.QUESTION,
			content: params.question,
			payload: { raw: params.question },
		});

		const context: AdminAgentContext = {
			adminId: params.adminId,
			orderId: params.orderId ?? undefined,
			autonomousDecisionId: params.autonomousDecisionId ?? undefined,
			tenantId: params.tenantId ?? undefined,
			correlationId:
				params.orderId ?? params.autonomousDecisionId ?? params.adminId,
		};

		const payload: AgentQueryPayload = {
			question: params.question,
			topic: params.topic ?? "AUTONOMY",
		};

		const { answer, reasoning } = await adminCopilotAgent.handleQuery(
			session.id,
			context,
			payload,
		);

		return {
			sessionId: session.id,
			answer,
			reasoning,
		};
	}
}

export const agentSupervisorService = new AgentSupervisorService();

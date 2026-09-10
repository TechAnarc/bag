import { prisma } from "../../config/database";
import {
	AgentType,
	AgentSession,
	AgentMessage,
	AgentMessageKind,
	AgentMessageRole,
	AgentProposal,
} from "@prisma/client";

export class AgentsRepository {
	async createSession(params: {
		agentType: AgentType;
		tenantId?: string | null;
		userId?: string | null;
		adminId?: string | null;
		topic?: string | null;
		correlationId?: string | null;
	}): Promise<AgentSession> {
		return prisma.agentSession.create({
			data: {
				agentType: params.agentType,
				tenantId: params.tenantId ?? null,
				userId: params.userId ?? null,
				adminId: params.adminId ?? null,
				topic: params.topic ?? null,
				correlationId: params.correlationId ?? null,
			},
		});
	}

	async appendMessage(params: {
		sessionId: string;
		role: AgentMessageRole;
		kind: AgentMessageKind;
		content: string;
		payload?: unknown;
	}): Promise<AgentMessage> {
		return prisma.agentMessage.create({
			data: {
				sessionId: params.sessionId,
				role: params.role,
				kind: params.kind,
				content: params.content,
				payload: (params.payload ?? null) as any,
			},
		});
	}

	async createProposal(params: {
		sessionId: string;
		agentType: AgentType;
		targetEntityType: string;
		targetEntityId?: string | null;
		suggestedAction: string;
		rationale?: unknown;
		confidenceScore?: number | null;
	}): Promise<AgentProposal> {
		return prisma.agentProposal.create({
			data: {
				sessionId: params.sessionId,
				agentType: params.agentType,
				targetEntityType: params.targetEntityType,
				targetEntityId: params.targetEntityId ?? null,
				suggestedAction: params.suggestedAction,
				rationale: (params.rationale ?? null) as any,
				confidenceScore: params.confidenceScore ?? null,
			},
		});
	}

	async getSessionWithTranscript(sessionId: string) {
		return prisma.agentSession.findUnique({
			where: { id: sessionId },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
				proposals: {
					orderBy: { createdAt: "asc" },
				},
			},
		});
	}
}

export const agentsRepository = new AgentsRepository();

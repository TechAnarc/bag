import { AgentType, AgentMessageKind, AgentMessageRole } from "@prisma/client";

export type AgentKind = AgentType;

export type AgentChannel = "CUSTOMER" | "ADMIN";

export interface BaseAgentContext {
	tenantId?: string | null;
	correlationId?: string | null;
}

export interface CustomerAgentContext extends BaseAgentContext {
	userId: string;
	orderId?: string;
}

export interface AdminAgentContext extends BaseAgentContext {
	adminId: string;
	orderId?: string;
	autonomousDecisionId?: string;
}

export type AgentSessionContext = CustomerAgentContext | AdminAgentContext;

export interface AgentQueryPayload {
	question: string;
	topic?: string; // optional high-level hint from UI (ORDER, REFUND, TRUST, INVOICE, POLICY, etc.)
}

export interface AgentAnswerPayload {
	answer: string;
	summary: string;
	nextSteps?: string[];
	confidence: number;
}

export interface AgentReasoningStep {
	id: string;
	label: string;
	description: string;
	groundedIn: Array<
		| { type: "ORDER"; id: string }
		| { type: "USER"; id: string }
		| { type: "DECISION"; id: string }
		| { type: "EVENT"; id: string }
	>;
}

export interface AgentTranscriptEntry {
	role: AgentMessageRole;
	kind: AgentMessageKind;
	content: string;
	at: Date;
}

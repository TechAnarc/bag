import { Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/response";
import { agentSupervisorService } from "./agents.supervisor";
import { agentsRepository } from "./agents.repository";

export class AgentsController {
	/**
	 * POST /api/v1/agents/support
	 * Customer-facing Agentic Support Interface
	 */
	async customerSupport(req: Request, res: Response) {
		try {
			const auth = (req as any).auth;
			if (!auth?.id) {
				return sendError(
					res,
					"Authentication required for agent support.",
					401,
				);
			}

			const { question, orderId, topic } = req.body as {
				question: string;
				orderId?: string;
				topic?: string;
			};

			if (!question || typeof question !== "string") {
				return sendError(res, "Question is required.", 400);
			}

			const result = await agentSupervisorService.handleCustomerInteraction({
				userId: auth.id,
				tenantId: auth.tenantId,
				orderId: orderId ?? null,
				topic: topic ?? "ORDER",
				question,
			});

			return sendSuccess(res, "Agent response generated.", result);
		} catch (error: any) {
			return sendError(res, "Failed to generate agent response.");
		}
	}

	/**
	 * POST /api/v1/agents/admin/copilot
	 * Admin Copilot – ADE decision explainer
	 */
	async adminCopilot(req: Request, res: Response) {
		try {
			const auth = (req as any).admin || (req as any).auth;
			if (!auth?.id) {
				return sendError(
					res,
					"Admin authentication required for copilot.",
					401,
				);
			}

			const { question, orderId, autonomousDecisionId, topic } = req.body as {
				question: string;
				orderId?: string;
				autonomousDecisionId?: string;
				topic?: string;
			};

			if (!question || typeof question !== "string") {
				return sendError(res, "Question is required.", 400);
			}

			const result = await agentSupervisorService.handleAdminInteraction({
				adminId: auth.id,
				tenantId: auth.tenantId,
				orderId: orderId ?? null,
				autonomousDecisionId: autonomousDecisionId ?? null,
				topic: topic ?? "AUTONOMY",
				question,
			});

			return sendSuccess(res, "Admin copilot explanation generated.", result);
		} catch (error: any) {
			return sendError(res, "Failed to generate admin copilot response.");
		}
	}

	/**
	 * GET /api/v1/agents/sessions/:id
	 * Fetch full transcript and proposals for governance review.
	 */
	async getSession(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const session = await agentsRepository.getSessionWithTranscript(
				id as string,
			);

			if (!session) {
				return sendError(res, "Agent session not found.", 404);
			}

			return sendSuccess(res, "Agent session retrieved.", session);
		} catch (error: any) {
			return sendError(res, "Failed to retrieve agent session.");
		}
	}
}

export const agentsController = new AgentsController();

import { Request, Response } from "express";
import { prisma } from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response";
import { logger } from "../../config/logger";

export class AutonomyController {
	/**
	 * Decision Stream Viewer: Live feed of autonomous actions
	 */
	async getDecisionStream(req: Request, res: Response) {
		try {
			const { category, status, limit = 50, offset = 0 } = req.query;

			const decisions = await (prisma as any).autonomousDecision.findMany({
				where: {
					triggerSignal: category ? (category as string) : undefined,
					status: status ? (status as string) : undefined,
				},
				include: {
					policy: true,
				},
				orderBy: { createdAt: "desc" },
				take: Number(limit),
				skip: Number(offset),
			});

			return sendSuccess(
				res,
				"Decision stream retrieved from the cognitive core.",
				decisions,
			);
		} catch (error: any) {
			logger.error(
				"[AutonomyController] Decision Stream Retrieval Error",
				error,
			);
			return sendError(res, "Failed to retrieve decision stream.");
		}
	}

	/**
	 * Policy Control Panel: List all policies
	 */
	async getPolicies(req: Request, res: Response) {
		try {
			const policies = await (prisma as any).decisionPolicy.findMany({
				orderBy: { priority: "desc" },
			});
			return sendSuccess(res, "Autonomous policies retrieved.", policies);
		} catch (error: any) {
			return sendError(res, "Failed to retrieve policies.");
		}
	}

	/**
	 * Adjust Policy Thresholds & Status
	 */
	async updatePolicy(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { isActive, priority, thresholds, rules } = req.body;

			const updatedPolicy = await (prisma as any).decisionPolicy.update({
				where: { id },
				data: {
					isActive,
					priority,
					thresholds,
					rules,
					version: { increment: 1 },
				},
			});

			logger.info(
				`[AutonomyController] Policy ${updatedPolicy.name} updated to v${updatedPolicy.version} by Admin.`,
			);
			return sendSuccess(res, "Policy updated successfully.", updatedPolicy);
		} catch (error: any) {
			return sendError(res, "Failed to update policy.");
		}
	}

	/**
	 * Decision Override & Governance
	 */
	async overrideDecision(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { reason, adminId } = req.body;

			const decision = await (prisma as any).autonomousDecision.update({
				where: { id },
				data: {
					status: "OVERRIDDEN",
					isOverridden: true,
					overriddenBy: adminId || (req as any).auth?.id,
					overrideReason: reason,
				},
			});

			logger.warn(
				`[AutonomyController] Decision ${id} OVERRIDDEN by Admin: ${reason}`,
			);
			return sendSuccess(
				res,
				"Autonomous decision overridden by human supervisor.",
				decision,
			);
		} catch (error: any) {
			return sendError(res, "Failed to override decision.");
		}
	}
}

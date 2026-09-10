/**
 * Payment Audit Service
 * Writes immutable audit trail records for every payment lifecycle transition.
 * Never throws — audit failure must never interrupt business processing.
 */

import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { v4 as uuidv4 } from "uuid";

export interface AuditEntry {
	paymentId?: string;
	orderId?: string;
	eventType: string;
	fromStatus?: string;
	toStatus?: string;
	actor?: string;
	actorId?: string;
	metadata?: Record<string, unknown>;
	correlationId?: string;
	webhookEventId?: string;
}

export class PaymentAuditService {
	async log(entry: AuditEntry): Promise<void> {
		try {
			await (prisma as any).paymentAuditLog.create({
				data: {
					id: uuidv4(),
					paymentId: entry.paymentId ?? null,
					orderId: entry.orderId ?? null,
					eventType: entry.eventType,
					fromStatus: entry.fromStatus ?? null,
					toStatus: entry.toStatus ?? null,
					actor: entry.actor ?? "SYSTEM",
					actorId: entry.actorId ?? null,
					metadata: (entry.metadata ?? null) as any,
					correlationId: entry.correlationId ?? null,
					webhookEventId: entry.webhookEventId ?? null,
					occurredAt: new Date(),
				},
			});
		} catch (err: any) {
			// Audit logging must never fail silently for observability
			logger.error(
				`[PaymentAudit] Failed to write audit log [${entry.eventType}]: ${err.message}`,
				{
					paymentId: entry.paymentId,
					orderId: entry.orderId,
				},
			);
		}
	}

	async getHistory(paymentId: string): Promise<any[]> {
		try {
			return await (prisma as any).paymentAuditLog.findMany({
				where: { paymentId },
				orderBy: { occurredAt: "asc" },
			});
		} catch {
			return [];
		}
	}

	async getOrderHistory(orderId: string): Promise<any[]> {
		try {
			return await (prisma as any).paymentAuditLog.findMany({
				where: { orderId },
				orderBy: { occurredAt: "asc" },
			});
		} catch {
			return [];
		}
	}
}

export const paymentAuditService = new PaymentAuditService();

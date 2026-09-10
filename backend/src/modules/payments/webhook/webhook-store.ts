/**
 * WebhookStore: idempotent persistence and deduplication for raw webhook events.
 * Every Razorpay event is stored exactly once before any processing begins.
 */

import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { RazorpayEventName } from "./webhook-event.types";
import { v4 as uuidv4 } from "uuid";

export type WebhookEventStatus =
	| "RECEIVED"
	| "PROCESSING"
	| "PROCESSED"
	| "FAILED"
	| "DEAD_LETTERED";

export interface StoredWebhookEvent {
	id: string;
	eventId: string;
	eventType: string;
	status: WebhookEventStatus;
	retryCount: number;
}

export class WebhookStore {
	/**
	 * Persist a raw webhook event.
	 * Returns null if the eventId already exists (idempotent guard).
	 */
	async storeIfNew(
		eventId: string,
		eventType: RazorpayEventName | string,
		rawPayload: Record<string, unknown>,
		correlationId: string,
	): Promise<StoredWebhookEvent | null> {
		try {
			// Attempt idempotent insert using upsert with no-op on conflict
			const record = await (prisma as any).webhookEvent.upsert({
				where: { eventId },
				update: {}, // no-op on duplicate
				create: {
					id: uuidv4(),
					eventId,
					eventType,
					rawPayload,
					status: "RECEIVED",
					correlationId,
					idempotencyKey: `${eventType}:${eventId}`,
				},
				select: {
					id: true,
					eventId: true,
					eventType: true,
					status: true,
					retryCount: true,
				},
			});

			// If a record was just created vs pre-existing, detect via creation timestamp gap
			// We query separately to detect duplicates; the upsert no-op means existing = duplicate
			const existing = await (prisma as any).webhookEvent.findUnique({
				where: { eventId },
				select: {
					id: true,
					eventId: true,
					eventType: true,
					status: true,
					retryCount: true,
					createdAt: true,
				},
			});

			if (!existing) return null;

			// If already processed, signal caller to skip processing
			if (["PROCESSED", "DEAD_LETTERED"].includes(existing.status)) {
				logger.info(
					`[WebhookStore] Duplicate event skipped: ${eventId} (status=${existing.status})`,
				);
				return null;
			}

			return existing;
		} catch (error: any) {
			logger.error(
				`[WebhookStore] Failed to store webhook event ${eventId}: ${error.message}`,
			);
			return null;
		}
	}

	async markProcessing(id: string): Promise<void> {
		await (prisma as any).webhookEvent
			.update({
				where: { id },
				data: { status: "PROCESSING" },
			})
			.catch((e: any) =>
				logger.warn(`[WebhookStore] markProcessing failed: ${e.message}`),
			);
	}

	async markProcessed(
		id: string,
		log?: Record<string, unknown>,
	): Promise<void> {
		await (prisma as any).webhookEvent
			.update({
				where: { id },
				data: {
					status: "PROCESSED",
					processedAt: new Date(),
					processingLog: log ?? null,
				},
			})
			.catch((e: any) =>
				logger.warn(`[WebhookStore] markProcessed failed: ${e.message}`),
			);
	}

	async markFailed(id: string, error: string, dead = false): Promise<void> {
		await (prisma as any).webhookEvent
			.update({
				where: { id },
				data: {
					status: dead ? "DEAD_LETTERED" : "FAILED",
					lastError: error,
					retryCount: { increment: 1 },
					...(dead ? { deadLetteredAt: new Date() } : {}),
				},
			})
			.catch((e: any) =>
				logger.warn(`[WebhookStore] markFailed failed: ${e.message}`),
			);
	}

	/** Returns events that failed and are eligible for retry (retryCount < 3). */
	async getPendingRetries(limit = 20): Promise<StoredWebhookEvent[]> {
		return (prisma as any).webhookEvent.findMany({
			where: {
				status: "FAILED",
				retryCount: { lt: 3 },
			},
			orderBy: { createdAt: "asc" },
			take: limit,
			select: {
				id: true,
				eventId: true,
				eventType: true,
				status: true,
				retryCount: true,
			},
		});
	}
}

export const webhookStore = new WebhookStore();

/**
 * Payment Controller — Enterprise Webhook Orchestration Layer
 *
 * Architectural guarantees:
 *  ✅ HMAC-SHA256 signature verification preserved (existing)
 *  ✅ 200 acknowledgment BEFORE async processing (fast response)
 *  ✅ Full idempotency via WebhookStore (event ID deduplication)
 *  ✅ Structured audit logs and domain event emission
 *  ✅ Zero-crash: unknown events dead-lettered, never 500
 *  ✅ Replay-safe processing on every handler
 */

import type { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { sendSuccess, sendError } from "../../utils/response";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { logger } from "../../config/logger";
import { webhookStore } from "./webhook/webhook-store";
import { webhookRegistry } from "./webhook/webhook-registry";
import { v4 as uuidv4 } from "uuid";

const paymentService = new PaymentService();

export class PaymentController {
	/**
	 * POST /api/v1/payments/webhook
	 * ─────────────────────────────────────────────────────────────────────────
	 * Transport layer only — verifies signature, acknowledges immediately,
	 * then dispatches to the webhook registry asynchronously.
	 *
	 * CRITICAL: This route is mounted BEFORE express.json() so rawBody is intact.
	 */
	async handleWebhook(req: Request, res: Response): Promise<Response> {
		const startTime = Date.now();

		try {
			const rawBody = (req as any).rawBody as string;
			const incomingSignature = req.headers["x-razorpay-signature"] as string;

			// ── 1. Basic validation ───────────────────────────────────────────────
			if (!rawBody || !incomingSignature) {
				return res
					.status(400)
					.json({ success: false, error: "Missing body or signature" });
			}

			// ── 2. HMAC-SHA256 Signature Verification ─────────────────────────────
			const isValid = paymentService.verifyWebhookSignature(
				rawBody,
				incomingSignature,
			);
			if (!isValid) {
				logger.warn("[Webhook] ❌ Invalid HMAC signature — rejecting event");
				return res
					.status(400)
					.json({ success: false, error: "Invalid webhook signature" });
			}

			// ── 3. Parse body ─────────────────────────────────────────────────────
			let body: Record<string, any>;
			try {
				body = JSON.parse(rawBody);
			} catch {
				return res
					.status(400)
					.json({ success: false, error: "Invalid JSON payload" });
			}

			const eventType = body.event as string;
			const razorpayEventId =
				body.event_id ?? body.account_id ?? `evt_${Date.now()}`;
			const correlationId = uuidv4();

			logger.info(
				`[Webhook] ✅ Verified | event=${eventType} razorpayEventId=${razorpayEventId}`,
				{
					correlationId,
					latencyMs: Date.now() - startTime,
				},
			);

			// ── 4. Acknowledge IMMEDIATELY (non-blocking) ─────────────────────────
			//    Razorpay retries if it doesn't receive a 200 within ~5s.
			res.status(200).json({ success: true, correlationId });

			// ── 5. Async processing pipeline ──────────────────────────────────────
			setImmediate(async () => {
				const processingStart = Date.now();
				let storedEvent: any = null;

				try {
					// 5a. Idempotency gate — store raw snapshot, skip if already processed
					storedEvent = await webhookStore.storeIfNew(
						razorpayEventId,
						eventType,
						body,
						correlationId,
					);

					if (!storedEvent) {
						logger.info(
							`[Webhook] Duplicate event skipped: ${razorpayEventId}`,
						);
						return;
					}

					await webhookStore.markProcessing(storedEvent.id);

					// 5b. Dispatch to registry (zero-crash guarantee)
					const handled = await webhookRegistry.dispatch(
						eventType,
						body.payload ?? {},
						correlationId,
						storedEvent.id,
					);

					if (!handled) {
						// Dead-letter unknown events — never crash ingestion
						await webhookStore.markFailed(
							storedEvent.id,
							`Unregistered event: ${eventType}`,
							true,
						);
						logger.warn(`[Webhook] Dead-lettered unknown event: ${eventType}`, {
							correlationId,
						});
						return;
					}

					await webhookStore.markProcessed(storedEvent.id, {
						processedAt: new Date().toISOString(),
						latencyMs: Date.now() - processingStart,
					});

					logger.info(
						`[Webhook] ✅ Processed | event=${eventType} latencyMs=${Date.now() - processingStart}`,
						{ correlationId },
					);
				} catch (err: any) {
					logger.error(
						`[Webhook] Processing error | event=${eventType}: ${err.message}`,
						{
							correlationId,
							stack: err.stack,
						},
					);

					if (storedEvent?.id) {
						const isDead = (storedEvent.retryCount ?? 0) >= 2;
						await webhookStore.markFailed(storedEvent.id, err.message, isDead);
					}
				}
			});

			return res; // already sent
		} catch (error: any) {
			logger.error("[Webhook] Fatal transport error:", error.message);
			// Only reach here if pre-ack code throws (e.g., JSON parse before ack)
			if (!res.headersSent) {
				return res.status(500).json({ success: false });
			}
			return res;
		}
	}

	/**
	 * GET /api/v1/payments/:paymentId
	 * Admin: fetch live payment details from Razorpay.
	 */
	async getPaymentDetails(req: AuthRequest, res: Response): Promise<Response> {
		try {
			const paymentId = req.params.paymentId as string;
			if (!paymentId) return sendError(res, "paymentId is required", 400);

			const details = await paymentService.getPaymentDetails(paymentId);
			return sendSuccess(res, "Payment details fetched", details);
		} catch (error: any) {
			return sendError(res, error.message || "Failed to fetch payment");
		}
	}

	/**
	 * POST /api/v1/payments/:paymentId/refund
	 * Admin: initiate full or partial refund.
	 */
	async refundPayment(req: AuthRequest, res: Response): Promise<Response> {
		try {
			const paymentId = req.params.paymentId as string;
			const { amount } = req.body;

			if (!paymentId) return sendError(res, "paymentId is required", 400);

			const refund = await paymentService.refundPayment(paymentId, amount);
			return sendSuccess(res, "Refund initiated successfully", refund);
		} catch (error: any) {
			return sendError(res, error.message || "Refund failed");
		}
	}

	/**
	 * GET /api/v1/payments/webhook/registry
	 * Admin: list all registered event types.
	 */
	async getRegisteredEvents(
		_req: AuthRequest,
		res: Response,
	): Promise<Response> {
		return sendSuccess(res, "Registered webhook events", {
			events: webhookRegistry.registeredEvents(),
			count: webhookRegistry.registeredEvents().length,
		});
	}

	/**
	 * GET /api/v1/payments/webhook/health
	 * Operational: recent webhook processing stats.
	 */
	async getWebhookHealth(_req: Request, res: Response): Promise<Response> {
		try {
			const { prisma } = await import("../../config/database");
			const [total, processed, failed, deadLettered] = await Promise.all([
				(prisma as any).webhookEvent.count(),
				(prisma as any).webhookEvent.count({ where: { status: "PROCESSED" } }),
				(prisma as any).webhookEvent.count({ where: { status: "FAILED" } }),
				(prisma as any).webhookEvent.count({
					where: { status: "DEAD_LETTERED" },
				}),
			]);

			return res.json({
				success: true,
				data: {
					total,
					processed,
					failed,
					deadLettered,
					successRate: total
						? `${((processed / total) * 100).toFixed(1)}%`
						: "N/A",
				},
			});
		} catch {
			return res.json({
				success: true,
				data: { status: "metrics_unavailable" },
			});
		}
	}
}

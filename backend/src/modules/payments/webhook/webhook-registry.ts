/**
 * Webhook Event Registry
 * Central routing table mapping every Razorpay event name to a typed processor.
 *
 * Design properties:
 *  - Zero-crash: unknown events are logged and dead-lettered, never thrown
 *  - Transport-separated: handlers receive pure domain entities, not HTTP objects
 *  - Fully extensible: add new event → add one entry here
 */

import { logger } from "../../../config/logger";
import type { RazorpayEventName } from "./webhook-event.types";

import {
	handlePaymentAuthorized,
	handlePaymentCaptured,
	handlePaymentFailed,
} from "../processors/payment.processor";

import {
	handleRefundCreated,
	handleRefundProcessed,
	handleRefundFailed,
} from "../processors/refund.processor";

import {
	handleDisputeCreated,
	handleDisputeWon,
	handleDisputeLost,
	handleDisputeClosed,
	handleDisputeUnderReview,
	handleDisputeActionRequired,
} from "../processors/dispute.processor";

import { handleSubscriptionEvent } from "../processors/subscription.processor";

import {
	handleSettlementProcessed,
	handleInvoiceEvent,
	handlePaymentLinkEvent,
	handlePaymentDowntime,
	handleFundAccountValidation,
	handleAccountEvent,
	handleOrderNotificationDelivered,
} from "../processors/ancillary.processor";

// ─── Typed processor signature ────────────────────────────────────────────────
export type EventProcessor = (
	entity: any,
	correlationId: string,
	webhookEventId?: string,
) => Promise<void>;

type RegistryEntry = {
	/** Extracts the primary entity from payload.X.entity */
	entityPath: string;
	processor: EventProcessor;
};

// ─── Central Registry ─────────────────────────────────────────────────────────
const REGISTRY: Record<string, RegistryEntry> = {
	// ── Payment ──────────────────────────────────────────────────────────────
	"payment.authorized": {
		entityPath: "payment",
		processor: handlePaymentAuthorized,
	},
	"payment.captured": {
		entityPath: "payment",
		processor: handlePaymentCaptured,
	},
	"payment.failed": {
		entityPath: "payment",
		processor: handlePaymentFailed,
	},

	// ── Payment Downtime ──────────────────────────────────────────────────────
	"payment.downtime.started": {
		entityPath: "payment.downtime",
		processor: (entity, cid, wid) =>
			handlePaymentDowntime("payment.downtime.started", entity, cid, wid),
	},
	"payment.downtime.updated": {
		entityPath: "payment.downtime",
		processor: (entity, cid, wid) =>
			handlePaymentDowntime("payment.downtime.updated", entity, cid, wid),
	},
	"payment.downtime.resolved": {
		entityPath: "payment.downtime",
		processor: (entity, cid, wid) =>
			handlePaymentDowntime("payment.downtime.resolved", entity, cid, wid),
	},

	// ── Order ─────────────────────────────────────────────────────────────────
	"order.paid": {
		entityPath: "order",
		processor: async (entity, cid, _wid) => {
			logger.info(`[WebhookRegistry] order.paid | id=${entity.id}`, {
				correlationId: cid,
			});
		},
	},
	"order.notification.delivered": {
		entityPath: "notification",
		processor: handleOrderNotificationDelivered,
	},
	"order.notification.failed": {
		entityPath: "notification",
		processor: handleOrderNotificationDelivered, // same audit log path, failed variant
	},

	// ── Refund ────────────────────────────────────────────────────────────────
	"refund.created": {
		entityPath: "refund",
		processor: handleRefundCreated,
	},
	"refund.processed": {
		entityPath: "refund",
		processor: handleRefundProcessed,
	},
	"refund.failed": {
		entityPath: "refund",
		processor: handleRefundFailed,
	},
	"refund.speed_changed": {
		entityPath: "refund",
		processor: async (entity, cid, wid) => {
			logger.info(
				`[WebhookRegistry] refund.speed_changed | id=${entity.id} speed=${entity.speed_processed}`,
				{ correlationId: cid },
			);
			// Update speed_processed in refund record if it exists
			await (await import("../../../config/database")).prisma
				.$executeRawUnsafe(
					`UPDATE "RefundRecord" SET "speedProcessed" = $1, "updatedAt" = NOW() WHERE "razorpayRefundId" = $2`,
					entity.speed_processed ?? null,
					entity.id,
				)
				.catch(() => {});
		},
	},

	// ── Dispute ───────────────────────────────────────────────────────────────
	"payment.dispute.created": {
		entityPath: "payment.dispute",
		processor: handleDisputeCreated,
	},
	"payment.dispute.won": {
		entityPath: "payment.dispute",
		processor: handleDisputeWon,
	},
	"payment.dispute.lost": {
		entityPath: "payment.dispute",
		processor: handleDisputeLost,
	},
	"payment.dispute.closed": {
		entityPath: "payment.dispute",
		processor: handleDisputeClosed,
	},
	"payment.dispute.under_review": {
		entityPath: "payment.dispute",
		processor: handleDisputeUnderReview,
	},
	"payment.dispute.action_required": {
		entityPath: "payment.dispute",
		processor: handleDisputeActionRequired,
	},

	// ── Subscription ──────────────────────────────────────────────────────────
	"subscription.authenticated": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.authenticated", e, c, w),
	},
	"subscription.activated": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.activated", e, c, w),
	},
	"subscription.charged": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.charged", e, c, w),
	},
	"subscription.completed": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.completed", e, c, w),
	},
	"subscription.updated": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.updated", e, c, w),
	},
	"subscription.pending": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.pending", e, c, w),
	},
	"subscription.halted": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.halted", e, c, w),
	},
	"subscription.cancelled": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.cancelled", e, c, w),
	},
	"subscription.paused": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.paused", e, c, w),
	},
	"subscription.resumed": {
		entityPath: "subscription",
		processor: (e, c, w) =>
			handleSubscriptionEvent("subscription.resumed", e, c, w),
	},

	// ── Invoice ───────────────────────────────────────────────────────────────
	"invoice.paid": {
		entityPath: "invoice",
		processor: (e, c, w) => handleInvoiceEvent("invoice.paid", e, c, w),
	},
	"invoice.partially_paid": {
		entityPath: "invoice",
		processor: (e, c, w) =>
			handleInvoiceEvent("invoice.partially_paid", e, c, w),
	},
	"invoice.expired": {
		entityPath: "invoice",
		processor: (e, c, w) => handleInvoiceEvent("invoice.expired", e, c, w),
	},

	// ── Settlement ────────────────────────────────────────────────────────────
	"settlement.processed": {
		entityPath: "settlement",
		processor: handleSettlementProcessed,
	},

	// ── Fund Account Validation ───────────────────────────────────────────────
	"fund_account.validation.completed": {
		entityPath: "fund_account.validation",
		processor: (e, c, w) =>
			handleFundAccountValidation("fund_account.validation.completed", e, c, w),
	},
	"fund_account.validation.failed": {
		entityPath: "fund_account.validation",
		processor: (e, c, w) =>
			handleFundAccountValidation("fund_account.validation.failed", e, c, w),
	},

	// ── Account ───────────────────────────────────────────────────────────────
	// Razorpay emits these exact event strings from the dashboard
	"account.instantly_activated": {
		entityPath: "account",
		processor: (e, c, w) =>
			handleAccountEvent("account.instantly_activated", e, c, w),
	},
	"account.activated_kyc_pending": {
		entityPath: "account",
		processor: (e, c, w) =>
			handleAccountEvent("account.activated_kyc_pending", e, c, w),
	},
	// Legacy / alternate event names kept for backward compatibility
	"account.activated": {
		entityPath: "account",
		processor: (e, c, w) => handleAccountEvent("account.activated", e, c, w),
	},
	"account.needs_clarification": {
		entityPath: "account",
		processor: (e, c, w) =>
			handleAccountEvent("account.needs_clarification", e, c, w),
	},

	// ── Payment Link ──────────────────────────────────────────────────────────
	"payment_link.paid": {
		entityPath: "payment_link",
		processor: (e, c, w) =>
			handlePaymentLinkEvent("payment_link.paid", e, c, w),
	},
	"payment_link.partially_paid": {
		entityPath: "payment_link",
		processor: (e, c, w) =>
			handlePaymentLinkEvent("payment_link.partially_paid", e, c, w),
	},
	"payment_link.cancelled": {
		entityPath: "payment_link",
		processor: (e, c, w) =>
			handlePaymentLinkEvent("payment_link.cancelled", e, c, w),
	},
	"payment_link.expired": {
		entityPath: "payment_link",
		processor: (e, c, w) =>
			handlePaymentLinkEvent("payment_link.expired", e, c, w),
	},
};

/**
 * Resolve entity from Razorpay webhook payload using dot-notation entityPath.
 * Falls back gracefully if the path doesn't exist in the payload.
 */
function resolveEntity(payload: Record<string, any>, entityPath: string): any {
	const parts = entityPath.split(".");
	let current: any = payload;
	for (const part of parts) {
		if (current?.[part] === undefined) return payload; // fallback: pass full payload
		current = current[part];
	}
	return current?.entity ?? current;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const webhookRegistry = {
	/**
	 * Dispatch a verified Razorpay webhook to its typed processor.
	 * @returns true if handled, false if unknown event (dead-lettered)
	 */
	async dispatch(
		eventType: string,
		payload: Record<string, any>,
		correlationId: string,
		webhookEventId?: string,
	): Promise<boolean> {
		const entry = REGISTRY[eventType];

		if (!entry) {
			logger.warn(
				`[WebhookRegistry] ⚪ Unregistered event type: ${eventType}`,
				{ correlationId },
			);
			// Dead-letter: never crash, just log and return
			return false;
		}

		const entity = resolveEntity(payload, entry.entityPath);

		await entry.processor(entity, correlationId, webhookEventId);
		return true;
	},

	isRegistered(eventType: string): boolean {
		return eventType in REGISTRY;
	},

	registeredEvents(): string[] {
		return Object.keys(REGISTRY);
	},
};

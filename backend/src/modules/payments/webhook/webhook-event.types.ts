/**
 * Strongly typed Razorpay webhook payload definitions.
 * Version-safe parsing with optional/unknown field tolerance.
 */

export interface RazorpayWebhookBody {
	entity: "event";
	account_id: string;
	event: string;
	contains: string[];
	created_at: number;
	payload: Record<string, { entity: Record<string, unknown> }>;
}

// ─── Payment Entity ───────────────────────────────────────────────────────────
export interface RazorpayPaymentEntity {
	id: string;
	entity: "payment";
	amount: number;
	currency: string;
	status: "created" | "authorized" | "captured" | "refunded" | "failed";
	order_id: string;
	invoice_id?: string;
	international: boolean;
	method: string;
	amount_refunded: number;
	refund_status?: string;
	captured: boolean;
	description?: string;
	card_id?: string;
	bank?: string;
	wallet?: string;
	vpa?: string;
	email: string;
	contact: string;
	notes: Record<string, string>;
	fee?: number;
	tax?: number;
	error_code?: string;
	error_description?: string;
	error_source?: string;
	error_step?: string;
	error_reason?: string;
	acquirer_data?: Record<string, unknown>;
	created_at: number;
}

// ─── Order Entity ─────────────────────────────────────────────────────────────
export interface RazorpayOrderEntity {
	id: string;
	entity: "order";
	amount: number;
	amount_paid: number;
	amount_due: number;
	currency: string;
	receipt?: string;
	offer_id?: string;
	status: "created" | "attempted" | "paid";
	attempts: number;
	notes: Record<string, string>;
	created_at: number;
}

// ─── Refund Entity ────────────────────────────────────────────────────────────
export interface RazorpayRefundEntity {
	id: string;
	entity: "refund";
	amount: number;
	currency: string;
	payment_id: string;
	notes: Record<string, string>;
	receipt?: string;
	acquirer_data?: Record<string, unknown>;
	created_at: number;
	batch_id?: string;
	status: "pending" | "processed" | "failed" | "cancelled";
	speed_processed?: string;
	speed_requested?: string;
}

// ─── Dispute Entity ───────────────────────────────────────────────────────────
export interface RazorpayDisputeEntity {
	id: string;
	entity: "dispute";
	payment_id: string;
	amount: number;
	currency: string;
	amount_deducted: number;
	reason_code: string;
	respond_by: number;
	status: "open" | "under_review" | "won" | "lost" | "closed" | "accepted";
	phase: "chargeback" | "pre_arbitration" | "arbitration";
	created_at: number;
	evidence?: Record<string, unknown>;
}

// ─── Subscription Entity ──────────────────────────────────────────────────────
export interface RazorpaySubscriptionEntity {
	id: string;
	entity: "subscription";
	plan_id: string;
	status:
		| "created"
		| "authenticated"
		| "active"
		| "pending"
		| "halted"
		| "cancelled"
		| "completed"
		| "expired";
	current_start?: number;
	current_end?: number;
	ended_at?: number;
	quantity: number;
	total_count: number;
	paid_count: number;
	remaining_count: number;
	customer_id?: string;
	charge_at: number;
	start_at?: number;
	end_at?: number;
	notes: Record<string, string>;
	created_at: number;
}

// ─── Settlement Entity ────────────────────────────────────────────────────────
export interface RazorpaySettlementEntity {
	id: string;
	entity: "settlement";
	amount: number;
	status: "created" | "processed" | "failed";
	fees: number;
	tax: number;
	utr?: string;
	created_at: number;
	description?: string;
}

// ─── Invoice Entity ───────────────────────────────────────────────────────────
export interface RazorpayInvoiceEntity {
	id: string;
	entity: "invoice";
	type: string;
	status: "draft" | "issued" | "paid" | "cancelled" | "expired";
	billing_start?: number;
	billing_end?: number;
	issued_at?: number;
	paid_at?: number;
	amount: number;
	currency: string;
	subscription_id?: string;
	order_id?: string;
	payment_id?: string;
	created_at: number;
}

// ─── Payment Link Entity ──────────────────────────────────────────────────────
export interface RazorpayPaymentLinkEntity {
	id: string;
	entity: "payment_link";
	amount: number;
	currency: string;
	status: "created" | "paid" | "cancelled" | "expired";
	description?: string;
	short_url: string;
	expire_by?: number;
	expired_at?: number;
	created_at: number;
	payments?: Array<{ payment_id: string; created_at: number }>;
	reference_id?: string;
	customer?: { name?: string; email?: string; contact?: string };
}

// ─── Fund Account Validation Entity ──────────────────────────────────────────
export interface RazorpayFAVEntity {
	id: string;
	entity: "fund_account.validation";
	fund_account_id: string;
	status: "created" | "completed" | "failed";
	amount: number;
	currency: string;
	results?: Record<string, unknown>;
	created_at: number;
}

// ─── Account Entity ───────────────────────────────────────────────────────────
export interface RazorpayAccountEntity {
	id: string;
	entity: "account";
	profile?: Record<string, unknown>;
	status: string;
	created_at: number;
}

// ─── Registered event names ───────────────────────────────────────────────────
export type RazorpayEventName =
	// Payment
	| "payment.authorized"
	| "payment.captured"
	| "payment.failed"
	// Payment Downtime
	| "payment.downtime.started"
	| "payment.downtime.updated"
	| "payment.downtime.resolved"
	// Order
	| "order.paid"
	| "order.notification.delivered"
	| "order.notification.failed"
	// Refund
	| "refund.created"
	| "refund.processed"
	| "refund.failed"
	| "refund.speed_changed"
	// Dispute
	| "payment.dispute.created"
	| "payment.dispute.won"
	| "payment.dispute.lost"
	| "payment.dispute.closed"
	| "payment.dispute.under_review"
	| "payment.dispute.action_required"
	// Subscription
	| "subscription.authenticated"
	| "subscription.activated"
	| "subscription.charged"
	| "subscription.completed"
	| "subscription.updated"
	| "subscription.pending"
	| "subscription.halted"
	| "subscription.cancelled"
	| "subscription.paused"
	| "subscription.resumed"
	// Invoice
	| "invoice.paid"
	| "invoice.partially_paid"
	| "invoice.expired"
	// Settlement
	| "settlement.processed"
	// Fund Account Validation
	| "fund_account.validation.completed"
	| "fund_account.validation.failed"
	// Account
	| "account.instantly_activated"
	| "account.activated_kyc_pending"
	| "account.activated"
	| "account.needs_clarification"
	// Payment Link
	| "payment_link.paid"
	| "payment_link.partially_paid"
	| "payment_link.cancelled"
	| "payment_link.expired";

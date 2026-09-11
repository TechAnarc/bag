/**
 * Settlement, Invoice, Payment-Link, Downtime & Account Processors
 * Grouped file for lower-frequency lifecycle events.
 */

import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { paymentAuditService } from "../services/payment-audit.service";
import { domainEventBus } from "../services/domain-event.bus";
import { reconciliationService } from "../services/reconciliation.service";
import type {
	RazorpaySettlementEntity,
	RazorpayInvoiceEntity,
	RazorpayPaymentLinkEntity,
	RazorpayFAVEntity,
	RazorpayAccountEntity,
} from "../webhook/webhook-event.types";

// ─── Settlement ───────────────────────────────────────────────────────────────
export async function handleSettlementProcessed(
	entity: RazorpaySettlementEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(
		`[SettlementProcessor] 🏦 settlement.processed | id=${entity.id} ₹${entity.amount / 100} utr=${entity.utr}`,
		{ correlationId },
	);

	await prisma.settlementRecord.upsert({
		where: { razorpaySettlementId: entity.id },
		update: {
			status: entity.status,
			utr: entity.utr ?? null,
			settledAt: entity.status === "processed" ? new Date() : null,
			isReconciled: false,
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpaySettlementId: entity.id,
			amountPaise: entity.amount,
			currency: "INR",
			status: entity.status,
			fees: entity.fees,
			tax: entity.tax,
			utr: entity.utr ?? null,
			description: entity.description ?? null,
			settledAt: entity.status === "processed" ? new Date() : null,
			correlationId,
		},
	});

	await reconciliationService.record({
		type: "SETTLEMENT",
		razorpaySettlementId: entity.id,
		actualAmountPaise: entity.amount,
		correlationId,
	});

	// Mark reconciled
	await prisma.settlementRecord.updateMany({
		where: { razorpaySettlementId: entity.id },
		data: { isReconciled: true, reconciledAt: new Date() },
	});

	await paymentAuditService.log({
		eventType: "SETTLEMENT_PROCESSED",
		toStatus: entity.status,
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			settlementId: entity.id,
			amount: entity.amount,
			fees: entity.fees,
			tax: entity.tax,
			utr: entity.utr,
		},
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: "SETTLEMENT_RECONCILED",
		aggregateType: "Settlement",
		aggregateId: entity.id,
		payload: {
			settlementId: entity.id,
			amount: entity.amount,
			utr: entity.utr,
		},
		correlationId,
	});
}

// ─── Invoice ──────────────────────────────────────────────────────────────────
export async function handleInvoiceEvent(
	razorpayEvent: string,
	entity: RazorpayInvoiceEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	const isPaid = razorpayEvent === "invoice.paid";
	logger.info(`[InvoiceProcessor] 🧾 ${razorpayEvent} | id=${entity.id}`, {
		correlationId,
	});

	await paymentAuditService.log({
		eventType: razorpayEvent.toUpperCase().replace(".", "_"),
		toStatus: entity.status,
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			invoiceId: entity.id,
			amount: entity.amount,
			subscriptionId: entity.subscription_id,
		},
		correlationId,
		webhookEventId,
	});

	if (isPaid) {
		await domainEventBus.publish({
			eventType: "INVOICE_PAID",
			aggregateType: "Invoice",
			aggregateId: entity.id,
			payload: {
				invoiceId: entity.id,
				amount: entity.amount,
				subscriptionId: entity.subscription_id,
				orderId: entity.order_id,
			},
			correlationId,
		});
	} else if (razorpayEvent === "invoice.expired") {
		await domainEventBus.publish({
			eventType: "INVOICE_EXPIRED",
			aggregateType: "Invoice",
			aggregateId: entity.id,
			payload: { invoiceId: entity.id, amount: entity.amount },
			correlationId,
		});
	}
}

// ─── Payment Link ─────────────────────────────────────────────────────────────
export async function handlePaymentLinkEvent(
	razorpayEvent: string,
	entity: RazorpayPaymentLinkEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	const isPaid = razorpayEvent === "payment_link.paid";
	logger.info(`[PaymentLinkProcessor] 🔗 ${razorpayEvent} | id=${entity.id}`, {
		correlationId,
	});

	await prisma.paymentLinkRecord.upsert({
		where: { razorpayLinkId: entity.id },
		update: {
			status: entity.status,
			paidAt: isPaid ? new Date() : null,
			razorpayPaymentId: entity.payments?.[0]?.payment_id ?? null,
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpayLinkId: entity.id,
			amountPaise: entity.amount,
			currency: entity.currency,
			status: entity.status,
			description: entity.description ?? null,
			expiresAt: entity.expire_by ? new Date(entity.expire_by * 1000) : null,
			shortUrl: entity.short_url,
			referenceId: entity.reference_id ?? null,
			correlationId,
		},
	});

	await paymentAuditService.log({
		eventType: razorpayEvent.toUpperCase().replace(".", "_").replace(".", "_"),
		toStatus: entity.status,
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			linkId: entity.id,
			amount: entity.amount,
			status: entity.status,
		},
		correlationId,
		webhookEventId,
	});

	if (isPaid) {
		await domainEventBus.publish({
			eventType: "PAYMENT_LINK_COMPLETED",
			aggregateType: "PaymentLink",
			aggregateId: entity.id,
			payload: {
				linkId: entity.id,
				amount: entity.amount,
				paymentId: entity.payments?.[0]?.payment_id,
			},
			correlationId,
		});
	} else if (razorpayEvent === "payment_link.expired") {
		await domainEventBus.publish({
			eventType: "PAYMENT_LINK_EXPIRED",
			aggregateType: "PaymentLink",
			aggregateId: entity.id,
			payload: { linkId: entity.id, amount: entity.amount },
			correlationId,
		});
	}
}

// ─── Payment Downtime ─────────────────────────────────────────────────────────
export async function handlePaymentDowntime(
	razorpayEvent: string,
	entity: Record<string, unknown>,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	const isStart = razorpayEvent === "payment.downtime.started";
	logger[isStart ? "error" : "info"](
		`[DowntimeProcessor] ${isStart ? "🔴" : "🟢"} ${razorpayEvent}`,
		{ entity, correlationId },
	);

	await paymentAuditService.log({
		eventType: isStart
			? "PAYMENT_DOWNTIME_STARTED"
			: "PAYMENT_DOWNTIME_RESOLVED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: entity as Record<string, unknown>,
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: isStart
			? "PAYMENT_DOWNTIME_STARTED"
			: "PAYMENT_DOWNTIME_RESOLVED",
		aggregateType: "Gateway",
		aggregateId: "razorpay",
		payload: entity as Record<string, unknown>,
		correlationId,
	});
}

// ─── Fund Account Validation ──────────────────────────────────────────────────
export async function handleFundAccountValidation(
	razorpayEvent: string,
	entity: RazorpayFAVEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(
		`[FAVProcessor] 🏦 ${razorpayEvent} | id=${entity.id} status=${entity.status}`,
		{ correlationId },
	);

	await paymentAuditService.log({
		eventType: razorpayEvent.toUpperCase().replace(/\./g, "_"),
		toStatus: entity.status,
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			favId: entity.id,
			fundAccountId: entity.fund_account_id,
			results: entity.results,
		},
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: "FUND_ACCOUNT_VALIDATED",
		aggregateType: "FundAccount",
		aggregateId: entity.fund_account_id,
		payload: {
			favId: entity.id,
			status: entity.status,
			results: entity.results,
		},
		correlationId,
	});
}

// ─── Account Activation / KYC ─────────────────────────────────────────────────
export async function handleAccountEvent(
	razorpayEvent: string,
	entity: RazorpayAccountEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	const isActivated = razorpayEvent === "account.activated";
	logger[isActivated ? "info" : "warn"](
		`[AccountProcessor] ${isActivated ? "🟢" : "🔶"} ${razorpayEvent} | id=${entity.id}`,
		{ correlationId },
	);

	await paymentAuditService.log({
		eventType: razorpayEvent.toUpperCase().replace(".", "_"),
		toStatus: entity.status,
		actor: "RAZORPAY_WEBHOOK",
		metadata: { accountId: entity.id, profile: entity.profile },
		correlationId,
		webhookEventId,
	});

	await domainEventBus.publish({
		eventType: "ACCOUNT_ACTIVATED",
		aggregateType: "Account",
		aggregateId: entity.id,
		payload: { accountId: entity.id, status: entity.status },
		correlationId,
	});
}

// ─── Order Notification Delivery ─────────────────────────────────────────────
export async function handleOrderNotificationDelivered(
	entity: Record<string, unknown>,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info("[NotificationProcessor] 📬 order.notification.delivered", {
		entity,
		correlationId,
	});
	await paymentAuditService.log({
		eventType: "ORDER_NOTIFICATION_DELIVERED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: entity,
		correlationId,
		webhookEventId,
	});
}

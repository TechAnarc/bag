/**
 * Payment Event Processors
 * Handles: payment.authorized, payment.captured, payment.failed
 *
 * Each processor:
 *  - Is idempotent (safe to replay)
 *  - Persists PaymentRecord via upsert
 *  - Atomically updates Order status
 *  - Writes PaymentAuditLog
 *  - Publishes internal domain events
 *  - Records reconciliation entries
 */

import { prisma } from "../../../config/database";
import { logger } from "../../../config/logger";
import { v4 as uuidv4 } from "uuid";
import { paymentAuditService } from "../services/payment-audit.service";
import { domainEventBus } from "../services/domain-event.bus";
import { reconciliationService } from "../services/reconciliation.service";
import type { RazorpayPaymentEntity } from "../webhook/webhook-event.types";

// ─── payment.authorized ───────────────────────────────────────────────────────
export async function handlePaymentAuthorized(
	entity: RazorpayPaymentEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(
		`[PaymentProcessor] 🔐 payment.authorized | id=${entity.id} ₹${entity.amount / 100}`,
		{ correlationId },
	);

	// 1. Upsert PaymentRecord
	await prisma.paymentRecord.upsert({
		where: { razorpayPaymentId: entity.id },
		update: {
			status: "AUTHORIZED",
			authorizedAt: new Date(entity.created_at * 1000),
			method: entity.method,
			bank: entity.bank ?? null,
			wallet: entity.wallet ?? null,
			vpa: entity.vpa ?? null,
			gatewayMetadata: entity as any,
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpayPaymentId: entity.id,
			razorpayOrderId: entity.order_id,
			amountPaise: entity.amount,
			currency: entity.currency,
			status: "AUTHORIZED",
			method: entity.method,
			bank: entity.bank ?? null,
			wallet: entity.wallet ?? null,
			vpa: entity.vpa ?? null,
			email: entity.email,
			contact: entity.contact,
			international: entity.international,
			authorizedAt: new Date(entity.created_at * 1000),
			gatewayMetadata: entity as any,
			correlationId,
		},
	});

	// 2. Transition order to PAYMENT_PENDING if razorpayOrderId is linked
	if (entity.order_id) {
		const order = await prisma.order.findFirst({
			where: { razorpayOrderId: entity.order_id },
		});
		if (order && order.paymentStatus === "PENDING") {
			await prisma.$transaction(async (tx) => {
				await tx.order.update({
					where: { id: order.id },
					data: {
						paymentStatus: "PROCESSING",
						status: "PAYMENT_PENDING",
					},
				});
				await tx.orderTimelineEvent.create({
					data: {
						id: uuidv4(),
						orderId: order.id,
						status: "PAYMENT_PENDING",
						title: "Payment Authorized",
						description: `Payment authorized via ${entity.method}. Waiting for capture.`,
						actor: "RAZORPAY_WEBHOOK",
						metadata: {
							razorpayPaymentId: entity.id,
							method: entity.method,
						} as any,
					},
				});
			}, {
				maxWait: 10000,
				timeout: 25000,
			});
		}
	}

	// 3. Audit
	await paymentAuditService.log({
		paymentId: entity.id,
		orderId: entity.order_id,
		eventType: "PAYMENT_AUTHORIZED",
		toStatus: "AUTHORIZED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: { fraudMetadata: entity.acquirer_data, method: entity.method },
		correlationId,
		webhookEventId,
	});

	// 4. Internal domain event
	await domainEventBus.publish({
		eventType: "PAYMENT_AUTHORIZED",
		aggregateType: "Payment",
		aggregateId: entity.id,
		payload: {
			razorpayPaymentId: entity.id,
			razorpayOrderId: entity.order_id,
			amount: entity.amount,
			method: entity.method,
		},
		correlationId,
	});
}

// ─── payment.captured ─────────────────────────────────────────────────────────
export async function handlePaymentCaptured(
	entity: RazorpayPaymentEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.info(
		`[PaymentProcessor] ✅ payment.captured | id=${entity.id} ₹${entity.amount / 100}`,
		{ correlationId },
	);

	// 1. Upsert PaymentRecord
	await prisma.paymentRecord.upsert({
		where: { razorpayPaymentId: entity.id },
		update: {
			status: "CAPTURED",
			captured: true,
			capturedAt: new Date(),
			gatewayMetadata: entity as any,
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpayPaymentId: entity.id,
			razorpayOrderId: entity.order_id,
			amountPaise: entity.amount,
			currency: entity.currency,
			status: "CAPTURED",
			captured: true,
			capturedAt: new Date(),
			method: entity.method,
			email: entity.email,
			contact: entity.contact,
			international: entity.international,
			gatewayMetadata: entity as any,
			correlationId,
		},
	});

	// 2. Atomically finalize order + ledger + inventory
	if (entity.order_id) {
		const order = await prisma.order.findFirst({
			where: { razorpayOrderId: entity.order_id },
			include: { items: true },
		});

		if (order && order.paymentStatus !== "COMPLETED") {
			// Link orderId to PaymentRecord
			await prisma.paymentRecord.updateMany({
				where: { razorpayPaymentId: entity.id },
				data: { orderId: order.id },
			}).catch(() => {});

			await prisma.$transaction(async (tx) => {
				// 2a. Update order status
				await tx.order.update({
					where: { id: order.id },
					data: {
						paymentStatus: "COMPLETED",
						status: "PAYMENT_CONFIRMED",
						razorpayPaymentId: entity.id,
					},
				});

				// 2b. Timeline
				await tx.orderTimelineEvent.create({
					data: {
						id: uuidv4(),
						orderId: order.id,
						status: "PAYMENT_CONFIRMED",
						title: "Payment Captured",
						description: `₹${entity.amount / 100} captured via ${entity.method}. Order confirmed.`,
						actor: "RAZORPAY_WEBHOOK",
						metadata: {
							razorpayPaymentId: entity.id,
							method: entity.method,
							amountPaise: entity.amount,
						} as any,
					},
				});

				// 2c. Financial ledger entry
				await tx.ledgerEntry.create({
					data: {
						id: uuidv4(),
						tenantId: order.tenantId ?? "default",
						orderId: order.id,
						type: "CREDIT",
						amount: entity.amount / 100,
						currency: entity.currency,
						source: "RAZORPAY_CAPTURE",
						description: `Payment captured for order ${order.orderNumber}`,
						metadata: {
							razorpayPaymentId: entity.id,
							razorpayOrderId: entity.order_id,
						} as any,
					},
				});

				// 2d. Fulfill inventory reservations
				await tx.inventoryReservation.updateMany({
					where: { orderId: order.id, status: "RESERVED" },
					data: { status: "FULFILLED" },
				});
			}, {
				maxWait: 10000,
				timeout: 25000,
			});

			// 2e. Reconciliation
			await reconciliationService.record({
				type: "PAYMENT_CAPTURE",
				orderId: order.id,
				razorpayPaymentId: entity.id,
				razorpayOrderId: entity.order_id,
				expectedAmountPaise: order.total * 100,
				actualAmountPaise: entity.amount,
				correlationId,
			});
		}
	}

	// 3. Audit
	await paymentAuditService.log({
		paymentId: entity.id,
		orderId: entity.order_id,
		eventType: "PAYMENT_CAPTURED",
		fromStatus: "AUTHORIZED",
		toStatus: "CAPTURED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			amount: entity.amount,
			method: entity.method,
			fee: entity.fee,
			tax: entity.tax,
		},
		correlationId,
		webhookEventId,
	});

	// 4. Internal domain events
	await domainEventBus.publish({
		eventType: "PAYMENT_CONFIRMED",
		aggregateType: "Payment",
		aggregateId: entity.id,
		payload: {
			razorpayPaymentId: entity.id,
			razorpayOrderId: entity.order_id,
			amount: entity.amount,
			method: entity.method,
		},
		correlationId,
	});
}

// ─── payment.failed ───────────────────────────────────────────────────────────
export async function handlePaymentFailed(
	entity: RazorpayPaymentEntity,
	correlationId: string,
	webhookEventId?: string,
): Promise<void> {
	logger.warn(
		`[PaymentProcessor] ❌ payment.failed | id=${entity.id} reason=${entity.error_description}`,
		{ correlationId },
	);

	const retryEligible = entity.error_code !== "BAD_REQUEST_ERROR";

	// 1. Upsert PaymentRecord with structured failure metadata
	await prisma.paymentRecord.upsert({
		where: { razorpayPaymentId: entity.id },
		update: {
			status: "FAILED",
			errorCode: entity.error_code ?? null,
			errorDescription: entity.error_description ?? null,
			errorSource: entity.error_source ?? null,
			errorStep: entity.error_step ?? null,
			errorReason: entity.error_reason ?? null,
			retryEligible,
			recoveryState: "CUSTOMER_NOTIFIED_PENDING",
			gatewayMetadata: entity as any,
			updatedAt: new Date(),
		},
		create: {
			id: uuidv4(),
			razorpayPaymentId: entity.id,
			razorpayOrderId: entity.order_id,
			amountPaise: entity.amount,
			currency: entity.currency,
			status: "FAILED",
			method: entity.method,
			email: entity.email,
			contact: entity.contact,
			international: entity.international,
			errorCode: entity.error_code ?? null,
			errorDescription: entity.error_description ?? null,
			errorSource: entity.error_source ?? null,
			errorStep: entity.error_step ?? null,
			errorReason: entity.error_reason ?? null,
			retryEligible,
			recoveryState: "CUSTOMER_NOTIFIED_PENDING",
			gatewayMetadata: entity as any,
			correlationId,
		},
	});

	// 2. Update order state and restore inventory
	if (entity.order_id) {
		const order = await prisma.order.findFirst({
			where: { razorpayOrderId: entity.order_id },
			include: { items: true },
		});
		if (order && order.paymentStatus !== "COMPLETED") {
			await prisma.$transaction(async (tx) => {
				await tx.order.update({
					where: { id: order.id },
					data: {
						paymentStatus: "FAILED",
						status: "FAILED",
					},
				});
				await tx.orderTimelineEvent.create({
					data: {
						id: uuidv4(),
						orderId: order.id,
						status: "FAILED",
						title: "Payment Failed",
						description:
							entity.error_description ?? "Payment declined by gateway.",
						actor: "RAZORPAY_WEBHOOK",
						metadata: {
							errorCode: entity.error_code,
							errorSource: entity.error_source,
							retryEligible,
						} as any,
					},
				});

				// Restore stock for each item upon payment failure
				for (const item of order.items) {
					const rawProds = await tx.$queryRaw<any[]>`SELECT id, inventory FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;
					const prod = rawProds[0];
					if (prod) {
						const currentInv = (prod.inventory as any) || { quantity: 0, inStock: true };
						const currentQty = typeof currentInv.quantity === "number" ? currentInv.quantity : 0;
						const restoredQty = currentQty + item.quantity;
						await tx.product.update({
							where: { id: item.productId },
							data: {
								inventory: {
									...currentInv,
									quantity: restoredQty,
									inStock: restoredQty > 0,
								},
							},
						});
					}
				}

				// Release inventory reservations on failure
				await tx.inventoryReservation.updateMany({
					where: { orderId: order.id, status: "RESERVED" },
					data: { status: "RELEASED" },
				});
			}, {
				maxWait: 10000,
				timeout: 25000,
			});
		}
	}

	// 3. Audit
	await paymentAuditService.log({
		paymentId: entity.id,
		orderId: entity.order_id,
		eventType: "PAYMENT_FAILED",
		toStatus: "FAILED",
		actor: "RAZORPAY_WEBHOOK",
		metadata: {
			errorCode: entity.error_code,
			errorReason: entity.error_reason,
			errorSource: entity.error_source,
			retryEligible,
		},
		correlationId,
		webhookEventId,
	});

	// 4. Domain event
	await domainEventBus.publish({
		eventType: "PAYMENT_FAILED",
		aggregateType: "Payment",
		aggregateId: entity.id,
		payload: {
			razorpayPaymentId: entity.id,
			razorpayOrderId: entity.order_id,
			errorCode: entity.error_code,
			errorDescription: entity.error_description,
			retryEligible,
		},
		correlationId,
	});
}

import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { LedgerType } from "@prisma/client";

export class LedgerService {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		eventBus.subscribe(
			DomainEvent.PAYMENT_CONFIRMED,
			this.handlePaymentConfirmed.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.ORDER_CANCELLED,
			this.handleOrderCancelled.bind(this),
		);
	}

	private async handlePaymentConfirmed(order: any) {
		logger.info(`[Ledger] Recording CREDIT for order ${order.orderNumber}`);

		try {
			await prisma.ledgerEntry.create({
				data: {
					tenantId: order.tenantId || "DEFAULT", // Fallback for now
					orderId: order.id,
					type: LedgerType.CREDIT,
					amount: order.total,
					currency: order.currency || "INR",
					source: "GATEWAY",
					description: `Payment confirmed for order #${order.orderNumber}`,
					metadata: {
						paymentMethod: order.paymentMethod,
						razorpayPaymentId: order.razorpayPaymentId,
					},
				},
			});

			eventBus.emitDomainEvent(DomainEvent.LEDGER_ENTRY_CREATED, {
				orderId: order.id,
				type: LedgerType.CREDIT,
				amount: order.total,
			});
		} catch (error: any) {
			logger.error(
				`[Ledger] Failed to record credit for order ${order.orderNumber}: ${error.message}`,
			);
		}
	}

	private async handleOrderCancelled(order: any) {
		// Only record debit if payment was already confirmed
		const orderRecord = await prisma.order.findUnique({
			where: { id: order.id },
			include: { ledgerEntries: true },
		});

		if (orderRecord && orderRecord.paymentStatus === "COMPLETED") {
			logger.info(
				`[Ledger] Recording DEBIT for cancelled order ${order.orderNumber}`,
			);

			await prisma.ledgerEntry.create({
				data: {
					tenantId: order.tenantId || "DEFAULT",
					orderId: order.id,
					type: LedgerType.DEBIT,
					amount: order.total,
					currency: order.currency || "INR",
					source: "SYSTEM",
					description: `Refund initiated for cancelled order #${order.orderNumber}`,
					metadata: { reason: "Order Cancelled" },
				},
			});
		}
	}

	public async getTenantBalance(tenantId: string): Promise<number> {
		const aggregations = await prisma.ledgerEntry.groupBy({
			by: ["type"],
			where: { tenantId },
			_sum: { amount: true },
		});

		const credits = aggregations
			.filter((a: any) => a.type === LedgerType.CREDIT)
			.reduce((sum: number, a: any) => sum + (a._sum.amount || 0), 0);
		const debits = aggregations
			.filter((a: any) => a.type === LedgerType.DEBIT)
			.reduce((sum: number, a: any) => sum + (a._sum.amount || 0), 0);

		return credits - debits;
	}
}

export const ledgerService = new LedgerService();

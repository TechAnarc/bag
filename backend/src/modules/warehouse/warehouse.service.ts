import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { ReservationStatus } from "@prisma/client";

export class WarehouseService {
	constructor() {
		this.initializeSubscriptions();
	}

	private initializeSubscriptions() {
		eventBus.subscribe(
			DomainEvent.ORDER_CREATED,
			this.handleOrderCreated.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.PAYMENT_CONFIRMED,
			this.handlePaymentConfirmed.bind(this),
		);
		eventBus.subscribe(
			DomainEvent.ORDER_CANCELLED,
			this.handleOrderCancelled.bind(this),
		);
	}

	private async handleOrderCreated(order: any) {
		logger.info(`[Warehouse] Reserving stock for order ${order.orderNumber}`);

		try {
			await prisma.$transaction(async (tx) => {
				for (const item of order.items) {
					// 1. Create reservation
					await tx.inventoryReservation.create({
						data: {
							orderId: order.id,
							productId: item.productId,
							quantity: item.quantity,
							expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins expiry
						},
					});

					// 2. Update product staging inventory (if using a Json field, we need to be careful)
					const product = await tx.product.findUnique({
						where: { id: item.productId },
					});
					if (product && product.inventory) {
						const inv = product.inventory as any;
						const currentQty = inv.quantity || 0;

						if (currentQty < item.quantity) {
							throw new Error(`Insufficient stock for product ${product.name}`);
						}

						// We don't deduct from total yet, just mark as reserved
						// In a real system we'd have a 'reserved_quantity' column
					}
				}
			});

			eventBus.emitDomainEvent(DomainEvent.INVENTORY_RESERVED, {
				orderId: order.id,
			});
		} catch (error: any) {
			logger.error(
				`[Warehouse] Reservation failed for order ${order.orderNumber}: ${error.message}`,
			);
			// Logic to flag order for manual review if stock issue
		}
	}

	private async handlePaymentConfirmed(order: any) {
		logger.info(`[Warehouse] Deducting stock for order ${order.orderNumber}`);

		try {
			await prisma.$transaction(async (tx) => {
				// 1. Update reservations to FULFILLED
				await tx.inventoryReservation.updateMany({
					where: { orderId: order.id, status: ReservationStatus.RESERVED },
					data: { status: ReservationStatus.FULFILLED },
				});

				// 2. Actually deduct from product inventory
				for (const item of order.items) {
					const product = await tx.product.findUnique({
						where: { id: item.productId },
					});
					if (product && product.inventory) {
						const inv = product.inventory as any;
						const newQty = (inv.quantity || 0) - item.quantity;

						await tx.product.update({
							where: { id: item.productId },
							data: {
								inventory: {
									...inv,
									quantity: Math.max(0, newQty),
									inStock: newQty > 0,
								},
							},
						});
					}
				}
			});
		} catch (error: any) {
			logger.error(
				`[Warehouse] Deduction failed for order ${order.orderNumber}: ${error.message}`,
			);
		}
	}

	private async handleOrderCancelled(order: any) {
		logger.info(`[Warehouse] Releasing stock for order ${order.orderNumber}`);

		await prisma.inventoryReservation.updateMany({
			where: { orderId: order.id, status: ReservationStatus.RESERVED },
			data: { status: ReservationStatus.RELEASED },
		});
	}
}

export const warehouseService = new WarehouseService();

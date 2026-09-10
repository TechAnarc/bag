import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { logger } from "../../config/logger";
import { OrderStatus } from "@prisma/client";

export class SLAMonitor {
	private interval: NodeJS.Timeout | null = null;

	start() {
		logger.info("[SLA] Monitoring service started");
		// Scan every 15 minutes
		this.interval = setInterval(() => this.scanBreaches(), 15 * 60 * 1000);
		// Run once on start
		this.scanBreaches();
	}

	stop() {
		if (this.interval) clearInterval(this.interval);
	}

	private async scanBreaches() {
		logger.debug("[SLA] Scanning for breaches...");

		try {
			// Check if Order table exists before attempting queries
			const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Order'
              );
            `.catch(() => [{ exists: false }]);

			if (!tableExists || !tableExists[0]?.exists) {
				logger.debug("[SLA] Order table does not exist yet. Skipping scan.");
				return;
			}

			const breaches = await prisma.order.findMany({
				where: {
					status: {
						in: [
							OrderStatus.CREATED,
							OrderStatus.PAYMENT_PENDING,
							OrderStatus.PAYMENT_CONFIRMED,
							OrderStatus.PROCESSING,
						],
					},
					slaDeadline: { lt: new Date() },
					isEscalated: false,
				},
			});

			for (const order of breaches) {
				await this.escalateOrder(order);
			}
		} catch (error: any) {
			logger.debug(`[SLA] Scan skipped: ${error.message}`);
		}
	}

	private async escalateOrder(order: any) {
		logger.warn(`[SLA] Escalating order ${order.orderNumber} due to breach`);

		await prisma.order.update({
			where: { id: order.id },
			data: {
				isEscalated: true,
				escalationReason: "SLA_BREACH: Processing took too long",
			},
		});

		// Add timeline event
		await prisma.orderTimelineEvent.create({
			data: {
				orderId: order.id,
				status: order.status,
				title: "SLA Breach Recorded",
				description: "Order has exceeded the 6-hour packed deadline.",
				actor: "SYSTEM",
			},
		});

		// Emit event for other services (Notif, Admin Socket)
		eventBus.emitDomainEvent(DomainEvent.SLA_BREACHED, {
			orderId: order.id,
			orderNumber: order.orderNumber,
			userId: order.userId,
		});
	}
}

export const slaMonitor = new SLAMonitor();

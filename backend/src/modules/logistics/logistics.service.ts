import { prisma } from "../../config/database";

export interface DeliveryEstimate {
	partnerId: string;
	partnerName: string;
	cost: number;
	estimatedDays: number;
	express: boolean;
	reliabilityScore: number;
}

export class LogisticsService {
	/**
	 * Get best delivery options for an order
	 * Strategy: Filter partners by pincode coverage (mocked) and type.
	 */
	async getDeliveryOptions(
		pincode: string,
		weight: number,
	): Promise<DeliveryEstimate[]> {
		// 1. Fetch active partners
		const partners = await prisma.logisticsPartner.findMany({
			where: { isActive: true },
		});

		// 2. Mock Rate & SLA Calculation (Strategy Pattern Stubs)
		const options: DeliveryEstimate[] = partners.map((p: any) => {
			// Basic logic: Tier-1 cities get faster options
			const isMetro = ["11", "40", "56", "70"].includes(
				pincode.substring(0, 2),
			);
			let baseDays =
				p.type === "HYPERLOCAL" ? 0 : p.type === "INTERNATIONAL" ? 7 : 4;
			if (isMetro && p.capabilities.express)
				baseDays = Math.max(1, baseDays - 2);

			const cost = p.type === "HYPERLOCAL" ? 50 : 100 + weight * 0.1;

			return {
				partnerId: p.id,
				partnerName: p.name,
				cost,
				estimatedDays: baseDays,
				express: p.capabilities.express,
				reliabilityScore: p.reliabilityScore,
			};
		});

		// Sort by reliability then speed
		return options.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
	}

	/**
	 * Manifest a shipment (Mock Integration)
	 */
	async manifestShipment(orderId: string, partnerId: string) {
		const order = await prisma.order.findUnique({ where: { id: orderId } });
		if (!order) throw new Error("Order not found");

		const partner = await prisma.logisticsPartner.findUnique({
			where: { id: partnerId },
		});
		if (!partner) throw new Error("Partner not found");

		// MOCK API CALL TO PARTNER
		const trackingNumber = `TRV-${partner.code}-${Math.floor(Math.random() * 100000)}`;
		const waybill = `WB-${Math.floor(Math.random() * 10000000)}`;

		// Create Shipment Record
		const shipment = await prisma.shipment.create({
			data: {
				orderId,
				partnerId,
				trackingNumber,
				status: "MANIFESTED",
				waybill,
				manifestedAt: new Date(),
			},
		});

		return shipment;
	}

	/**
	 * Update Tracking Status (Webhook Receiver Logic)
	 */
	async updateShipmentStatus(
		trackingNumber: string,
		status: string,
		location?: string,
	) {
		const shipment = await prisma.shipment.findUnique({
			where: { trackingNumber },
		});

		if (!shipment) throw new Error("Shipment not found");

		const updated = await prisma.shipment.update({
			where: { id: shipment.id },
			data: {
				status,
				actualDeliveryAt: status === "DELIVERED" ? new Date() : undefined,
			},
		});

		// Return updated shipment for event emission higher up
		return updated;
	}
}

export const logisticsService = new LogisticsService();

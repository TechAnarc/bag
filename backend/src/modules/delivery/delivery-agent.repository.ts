import { prisma } from '../../config/database';
import {
	PrismaClient,
	DeliveryAgent,
	Order,
	OrderStatus,
} from "@prisma/client";



export class DeliveryAgentRepository {
	async findById(id: string): Promise<DeliveryAgent | null> {
		return prisma.deliveryAgent.findUnique({
			where: { id },
		});
	}

	async findByPhone(phone: string): Promise<DeliveryAgent | null> {
		return prisma.deliveryAgent.findUnique({
			where: { phone },
		});
	}

	async findAllActive(): Promise<DeliveryAgent[]> {
		return prisma.deliveryAgent.findMany({
			where: { active: true },
		});
	}

	async create(data: {
		name: string;
		phone: string;
		vehicleType?: string;
		vehicleNumber?: string;
	}): Promise<DeliveryAgent> {
		return prisma.deliveryAgent.create({
			data,
		});
	}

	async updateLocation(
		id: string,
		lat: number,
		lng: number,
	): Promise<DeliveryAgent> {
		return prisma.deliveryAgent.update({
			where: { id },
			data: {
				currentLat: lat,
				currentLng: lng,
				lastUpdated: new Date(),
			},
		});
	}

	async getAssignedOrders(agentId: string): Promise<Order[]> {
		return prisma.order.findMany({
			where: {
				deliveryAgentId: agentId,
				status: {
					in: [
						OrderStatus.SHIPPED,
						OrderStatus.OUT_FOR_DELIVERY,
						OrderStatus.PROCESSING,
						OrderStatus.PACKED,
					],
				},
			},
			include: {
				user: {
					select: {
						name: true,
						phone: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}

	async assignOrder(orderId: string, agentId: string): Promise<Order> {
		return prisma.order.update({
			where: { id: orderId },
			data: {
				deliveryAgentId: agentId,
			},
		});
	}
}

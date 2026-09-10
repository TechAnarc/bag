import { DeliveryAgentRepository } from "./delivery-agent.repository";
import { OrderService } from "../orders/order.service";
import { OrderStatus } from "@prisma/client";
import { SocketService } from "../../config/socket";

export class DeliveryService {
	private deliveryRepo = new DeliveryAgentRepository();
	// We'll lazy load OrderService to avoid circular dependency if it exists
	private orderService: OrderService | null = null;

	private getOrderService() {
		if (!this.orderService) {
			// This is a pattern to avoid circular imports if OrderService also needs DeliveryService
			const { OrderService } = require("../orders/order.service");
			this.orderService = new OrderService();
		}
		return this.orderService;
	}

	async registerAgent(data: {
		name: string;
		phone: string;
		vehicleType?: string;
		vehicleNumber?: string;
	}) {
		const existing = await this.deliveryRepo.findByPhone(data.phone);
		if (existing) throw new Error("Phone number already registered");
		return this.deliveryRepo.create(data);
	}

	async updateAgentLocation(agentId: string, lat: number, lng: number) {
		const agent = await this.deliveryRepo.updateLocation(agentId, lat, lng);

		// Notify tracking pages for orders assigned to this agent
		const orders = await this.deliveryRepo.getAssignedOrders(agentId);
		orders.forEach((order) => {
			SocketService.emitToOrder(order.id, "agent:location", { lat, lng });
		});

		return agent;
	}

	async getAgentDashboard(agentId: string) {
		const agent = await this.deliveryRepo.findById(agentId);
		if (!agent) throw new Error("Agent not found");

		const activeOrders = await this.deliveryRepo.getAssignedOrders(agentId);
		return { agent, activeOrders };
	}

	async assignOrderToAgent(orderId: string, agentId: string) {
		const order = await this.deliveryRepo.assignOrder(orderId, agentId);

		// Emit socket event to agent
		SocketService.emitToRoom(`agent:${agentId}`, "order:assigned", order);

		// Add timeline event
		const agent = await this.deliveryRepo.findById(agentId);
		await this.getOrderService().updateOrderStatus(
			orderId,
			order.status,
			`ASSIGNED_TO_${agent?.name}`,
		);

		return order;
	}

	async markAsOutForDelivery(orderId: string, agentId: string) {
		return this.getOrderService().updateOrderStatus(
			orderId,
			OrderStatus.OUT_FOR_DELIVERY,
			"DELIVERY_AGENT",
		);
	}

	async markAsDelivered(orderId: string, agentId: string) {
		// In the future add OTP verification or photo
		return this.getOrderService().updateOrderStatus(
			orderId,
			OrderStatus.DELIVERED,
			"DELIVERY_AGENT",
		);
	}
}

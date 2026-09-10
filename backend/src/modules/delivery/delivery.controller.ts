import { Request, Response } from "express";
import { DeliveryService } from "./delivery.service";

const deliveryService = new DeliveryService();

export class DeliveryController {
	async updateLocation(req: Request, res: Response) {
		try {
			const { lat, lng } = req.body;
			// In a real app we'd get agentId from JWT
			const agentId = req.params.agentId as string;

			const agent = await deliveryService.updateAgentLocation(
				agentId,
				lat as number,
				lng as number,
			);
			res.status(200).json({ success: true, data: agent });
		} catch (error: any) {
			res.status(400).json({ success: false, message: error.message });
		}
	}

	async getDashboard(req: Request, res: Response) {
		try {
			const agentId = req.params.agentId as string;
			const data = await deliveryService.getAgentDashboard(agentId);
			res.status(200).json({ success: true, data });
		} catch (error: any) {
			res.status(400).json({ success: false, message: error.message });
		}
	}

	async updateStatus(req: Request, res: Response) {
		try {
			const { orderId, status } = req.body;
			const agentId = req.params.agentId as string;

			let updatedOrder;
			if (status === "OUT_FOR_DELIVERY") {
				updatedOrder = await deliveryService.markAsOutForDelivery(
					orderId,
					agentId,
				);
			} else if (status === "DELIVERED") {
				updatedOrder = await deliveryService.markAsDelivered(orderId, agentId);
			} else {
				throw new Error("Invalid status update for delivery agent");
			}

			res.status(200).json({ success: true, data: updatedOrder });
		} catch (error: any) {
			res.status(400).json({ success: false, message: error.message });
		}
	}

	async assignOrder(req: Request, res: Response) {
		try {
			const { orderId, agentId } = req.body;
			const result = await deliveryService.assignOrderToAgent(orderId, agentId);
			res.status(200).json({ success: true, data: result });
		} catch (error: any) {
			res.status(400).json({ success: false, message: error.message });
		}
	}
}

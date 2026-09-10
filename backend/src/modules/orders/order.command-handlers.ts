import { commandBus, ICommand } from "../../core/commands/command-bus";
import { prisma } from "../../config/database";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { OrderStateMachine } from "./order.state-machine";
import { OrderStatus } from "@prisma/client";
import { logger } from "../../config/logger";

export const registerOrderHandlers = () => {
	commandBus.register("ApproveOrder", handleApproveOrder);
	commandBus.register("PackOrder", handlePackOrder);
	commandBus.register("ShipOrder", handleShipOrder);
	commandBus.register("AssignAgent", handleAssignAgent);
};

async function handleApproveOrder(command: ICommand) {
	const { orderId, notes } = command.payload;

	return await prisma.$transaction(async (tx: any) => {
		const order = await tx.order.findUnique({ where: { id: orderId } });
		if (!order) throw new Error("Order not found");

		if (
			!OrderStateMachine.isValidTransition(
				order.status as OrderStatus,
				OrderStatus.PROCESSING,
			)
		) {
			throw new Error(`Invalid transition from ${order.status} to PROCESSING`);
		}

		const updatedOrder = await tx.order.update({
			where: { id: orderId },
			data: {
				status: OrderStatus.PROCESSING,
				adminNotes: notes
					? `${order.adminNotes || ""}\n[Approve]: ${notes}`
					: order.adminNotes,
			},
		});

		await tx.orderTimelineEvent.create({
			data: {
				orderId,
				status: OrderStatus.PROCESSING,
				title: "Order Approved",
				description: notes || "Admin approved the order for processing.",
				actor: command.metadata.actor,
			},
		});

		await eventBus.emitDomainEvent(DomainEvent.ORDER_PROCESSING, updatedOrder, {
			tenantId: command.metadata.tenantId,
			actor: command.metadata.actor,
		});

		return updatedOrder;
	});
}

async function handlePackOrder(command: ICommand) {
	const { orderId, notes } = command.payload;

	return await prisma.$transaction(async (tx: any) => {
		const order = await tx.order.findUnique({ where: { id: orderId } });
		if (!order) throw new Error("Order not found");

		const targetStatus = "PACKED" as OrderStatus;

		if (
			!OrderStateMachine.isValidTransition(
				order.status as OrderStatus,
				targetStatus,
			)
		) {
			throw new Error(`Invalid transition from ${order.status} to PACKED`);
		}

		const updatedOrder = await tx.order.update({
			where: { id: orderId },
			data: {
				status: targetStatus,
				adminNotes: notes
					? `${order.adminNotes || ""}\n[Pack]: ${notes}`
					: order.adminNotes,
			},
		});

		await tx.orderTimelineEvent.create({
			data: {
				orderId,
				status: targetStatus,
				title: "Order Packed",
				description:
					notes || "Order has been packed and is ready for shipment.",
				actor: command.metadata.actor,
			},
		});

		await eventBus.emitDomainEvent(DomainEvent.ORDER_PACKED, updatedOrder, {
			tenantId: command.metadata.tenantId,
			actor: command.metadata.actor,
		});

		return updatedOrder;
	});
}

async function handleShipOrder(command: ICommand) {
	const { orderId, trackingNumber, carrier, notes } = command.payload;

	return await prisma.$transaction(async (tx: any) => {
		const order = await tx.order.findUnique({ where: { id: orderId } });
		if (!order) throw new Error("Order not found");

		const targetStatus = "SHIPPED" as OrderStatus;

		if (
			!OrderStateMachine.isValidTransition(
				order.status as OrderStatus,
				targetStatus,
			)
		) {
			throw new Error(`Invalid transition from ${order.status} to SHIPPED`);
		}

		const updatedOrder = await tx.order.update({
			where: { id: orderId },
			data: {
				status: targetStatus,
				trackingNumber,
				adminNotes: notes
					? `${order.adminNotes || ""}\n[Ship]: ${notes}`
					: order.adminNotes,
			},
		});

		await tx.orderTimelineEvent.create({
			data: {
				orderId,
				status: targetStatus,
				title: "Order Shipped",
				description: `Shipped via ${carrier || "Partner"}. Track ID: ${trackingNumber}`,
				actor: command.metadata.actor,
			},
		});

		await eventBus.emitDomainEvent(DomainEvent.ORDER_SHIPPED, updatedOrder, {
			tenantId: command.metadata.tenantId,
			actor: command.metadata.actor,
		});

		return updatedOrder;
	});
}

async function handleAssignAgent(command: ICommand) {
	const { orderId, agentId } = command.payload;

	return await prisma.$transaction(async (tx: any) => {
		const agent = await tx.deliveryAgent.findUnique({ where: { id: agentId } });
		if (!agent) throw new Error("Delivery Agent not found");

		const updatedOrder = await tx.order.update({
			where: { id: orderId },
			data: { deliveryAgentId: agentId },
		});

		await tx.orderTimelineEvent.create({
			data: {
				orderId,
				status: updatedOrder.status as OrderStatus,
				title: "Agent Assigned",
				description: `Assigned to delivery agent: ${agent.name}`,
				actor: command.metadata.actor,
			},
		});

		// Emit status update to trigger frontend refresh
		await eventBus.emitDomainEvent(DomainEvent.ORDER_PROCESSING, updatedOrder, {
			tenantId: command.metadata.tenantId,
			actor: command.metadata.actor,
		});

		return updatedOrder;
	});
}

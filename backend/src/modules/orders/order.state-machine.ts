import { OrderStatus } from "@prisma/client";

export class OrderStateMachine {
	private static readonly transitions: Record<OrderStatus, OrderStatus[]> = {
		[OrderStatus.CREATED]: [
			OrderStatus.PAYMENT_PENDING,
			OrderStatus.PAYMENT_CONFIRMED,
			OrderStatus.FAILED,
			OrderStatus.CANCELLED,
			OrderStatus.ORDER_CREATED,
		],
		[OrderStatus.ORDER_CREATED]: [
			OrderStatus.PAYMENT_CONFIRMED,
			OrderStatus.PICKUP_PENDING,
			OrderStatus.CANCELLED,
		],
		[OrderStatus.PAYMENT_PENDING]: [
			OrderStatus.PAYMENT_CONFIRMED,
			OrderStatus.FAILED,
			OrderStatus.CANCELLED,
		],
		[OrderStatus.PAYMENT_CONFIRMED]: [
			OrderStatus.PROCESSING,
			OrderStatus.PICKUP_PENDING,
			OrderStatus.CANCELLED,
			OrderStatus.REFUNDED,
		],
		[OrderStatus.PROCESSING]: [
			OrderStatus.PACKED,
			OrderStatus.PICKUP_PENDING,
			OrderStatus.CANCELLED,
			OrderStatus.REFUNDED,
		],
		[OrderStatus.PACKED]: [
			OrderStatus.PICKUP_PENDING,
			OrderStatus.SHIPPED,
			OrderStatus.CANCELLED,
		],

		// 🚚 Extended Logistics Highway (Phase 2)
		[OrderStatus.PICKUP_PENDING]: [
			OrderStatus.PICKUP_ASSIGNED,
			OrderStatus.PICKUP_CONFIRMED,
			OrderStatus.CANCELLED,
		],
		[OrderStatus.PICKUP_ASSIGNED]: [
			OrderStatus.PICKUP_CONFIRMED,
			OrderStatus.PICKUP_PENDING,
			OrderStatus.CANCELLED,
		],
		[OrderStatus.PICKUP_CONFIRMED]: [
			OrderStatus.PICKUP_COMPLETED,
			OrderStatus.IN_TRANSIT,
			OrderStatus.CANCELLED,
		],
		[OrderStatus.PICKUP_COMPLETED]: [
			OrderStatus.IN_TRANSIT,
			OrderStatus.OUT_FOR_DELIVERY,
		],
		[OrderStatus.IN_TRANSIT]: [
			OrderStatus.OUT_FOR_DELIVERY,
			OrderStatus.DELIVERY_FAILED,
		],

		[OrderStatus.SHIPPED]: [
			OrderStatus.IN_TRANSIT,
			OrderStatus.OUT_FOR_DELIVERY,
			OrderStatus.CANCELLED,
		],
		[OrderStatus.OUT_FOR_DELIVERY]: [
			OrderStatus.DELIVERED,
			OrderStatus.DELIVERY_FAILED,
			OrderStatus.FAILED,
			OrderStatus.CANCELLED,
		],
		[OrderStatus.DELIVERY_FAILED]: [
			OrderStatus.OUT_FOR_DELIVERY,
			OrderStatus.RETURN_INITIATED,
			OrderStatus.FAILED,
		],

		[OrderStatus.DELIVERED]: [
			OrderStatus.COMPLETED,
			OrderStatus.RETURN_REQUESTED,
			OrderStatus.RETURN_INITIATED,
		],
		[OrderStatus.COMPLETED]: [
			OrderStatus.RETURN_REQUESTED,
			OrderStatus.RETURN_INITIATED,
		],

		// 🔄 Returns Flow
		[OrderStatus.RETURN_INITIATED]: [
			OrderStatus.RETURN_COMPLETED,
			OrderStatus.COMPLETED,
		],
		[OrderStatus.RETURN_COMPLETED]: [OrderStatus.REFUNDED],
		[OrderStatus.RETURN_REQUESTED]: [
			OrderStatus.RETURNED,
			OrderStatus.RETURN_INITIATED,
			OrderStatus.COMPLETED,
		],
		[OrderStatus.RETURNED]: [OrderStatus.REFUNDED],

		[OrderStatus.CANCELLED]: [],
		[OrderStatus.REFUNDED]: [],
		[OrderStatus.FAILED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.PROCESSING],

		// Legacy/Fallback cases
		[OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
		[OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
	};

	/**
	 * Validate if a transition is allowed
	 */
	static isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
		const allowed = this.transitions[current] || [];
		return allowed.includes(next);
	}

	/**
	 * Get allowed next statuses
	 */
	static getAllowedNext(current: OrderStatus): OrderStatus[] {
		return this.transitions[current] || [];
	}

	/**
	 * Get default timeline message for a status
	 */
	static getStatusMetadata(status: OrderStatus) {
		const metadata: Record<string, { title: string; description: string }> = {
			[OrderStatus.CREATED]: {
				title: "Order Created",
				description: "Your order has been successfully placed.",
			},
			[OrderStatus.PAYMENT_PENDING]: {
				title: "Payment Pending",
				description: "Waiting for payment confirmation.",
			},
			[OrderStatus.PAYMENT_CONFIRMED]: {
				title: "Payment Confirmed",
				description: "We have received your payment.",
			},
			[OrderStatus.PROCESSING]: {
				title: "Processing",
				description: "Your order is being processed by our team.",
			},
			[OrderStatus.PACKED]: {
				title: "Packed",
				description: "Your order has been packed and is ready for shipment.",
			},
			[OrderStatus.SHIPPED]: {
				title: "Shipped",
				description: "Your order has been handed over to our delivery partner.",
			},
			[OrderStatus.OUT_FOR_DELIVERY]: {
				title: "Out for Delivery",
				description: "Your order is currently out for delivery.",
			},
			[OrderStatus.DELIVERED]: {
				title: "Delivered",
				description: "Order has been delivered.",
			},
			[OrderStatus.COMPLETED]: {
				title: "Completed",
				description: "Thank you for shopping with us!",
			},
			[OrderStatus.CANCELLED]: {
				title: "Cancelled",
				description: "Order has been cancelled.",
			},
			[OrderStatus.FAILED]: {
				title: "Failed",
				description: "The operation failed.",
			},
			[OrderStatus.RETURN_REQUESTED]: {
				title: "Return Requested",
				description: "A return request has been submitted.",
			},
			[OrderStatus.RETURNED]: {
				title: "Returned",
				description: "Product has been returned to our warehouse.",
			},
			[OrderStatus.REFUNDED]: {
				title: "Refunded",
				description: "Your payment has been refunded.",
			},
		};

		return (
			metadata[status] || {
				title: status,
				description: `Order status changed to ${status}`,
			}
		);
	}
}

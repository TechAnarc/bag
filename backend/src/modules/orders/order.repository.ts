import {
	PrismaClient,
	Order,
	OrderStatus,
	PaymentStatus,
	PaymentMethod,
} from "@prisma/client";

import { prisma } from "../../config/database";

export interface CreateOrderData {
	userId: string;
	items: Array<{
		productId: string;
		quantity: number;
		price: number;
		discount?: number;
	}>;
	subtotal: number;
	discount?: number;
	tax: number;
	shippingCharge?: number;
	total: number;
	paymentMethod: PaymentMethod;
	shippingAddress: any;
	billingAddress?: any;
	customerNotes?: string;
	slaDeadline?: Date;
	isFlagged?: boolean;
	riskLevel?: string;
}

export class OrderRepository {
	async createOrder(data: CreateOrderData) {
		const orderNumber = this.generateOrderNumber();

		return prisma.order.create({
			data: {
				orderNumber,
				userId: data.userId,
				subtotal: data.subtotal,
				discount: data.discount || 0,
				tax: data.tax,
				shippingCharge: data.shippingCharge || 0,
				total: data.total,
				paymentMethod: data.paymentMethod,
				shippingAddress: data.shippingAddress,
				billingAddress: data.billingAddress,
				customerNotes: data.customerNotes,
				status: OrderStatus.CREATED, // Initial state
				items: {
					create: data.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						price: item.price,
						discount: item.discount || 0,
						subtotal: item.price * item.quantity - (item.discount || 0),
					})),
				},
				timeline: {
					create: {
						status: OrderStatus.CREATED,
						title: "Order Placed",
						description: "Order has been created successfully.",
						actor: "SYSTEM",
					},
				},
			},
			include: {
				items: {
					include: {
						product: true,
					},
				},
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},
			},
		});
	}

	async getOrderById(orderId: string) {
		return prisma.order.findUnique({
			where: { id: orderId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},
				timeline: {
					orderBy: { timestamp: "asc" },
				},
			},
		});
	}

	async getOrderByNumber(orderNumber: string) {
		return prisma.order.findUnique({
			where: { orderNumber },
			include: {
				items: {
					include: {
						product: true,
					},
				},
				timeline: {
					orderBy: { timestamp: "asc" },
				},
			},
		});
	}

	async getUserOrders(userId: string) {
		return prisma.order.findMany({
			where: { userId },
			include: {
				items: {
					include: {
						product: {
							select: {
								id: true,
								name: true,
								slug: true,
								thumbnail: true,
								images: true,
							},
						},
					},
				},
				timeline: {
					orderBy: { timestamp: "asc" },
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async addTimelineEvent(
		orderId: string,
		status: OrderStatus,
		title: string,
		description?: string,
		actor: string = "SYSTEM",
		metadata?: any,
	) {
		return prisma.orderTimelineEvent.create({
			data: {
				orderId,
				status,
				title,
				description,
				actor,
				metadata,
			},
		});
	}

	async updateEstimatedDelivery(orderId: string, estimatedDelivery: Date) {
		return prisma.order.update({
			where: { id: orderId },
			data: { estimatedDelivery },
		});
	}

	async updateOrderDetails(
		orderId: string,
		data: {
			trackingNumber?: string;
			adminNotes?: string;
			estimatedDelivery?: Date;
		},
	) {
		return prisma.order.update({
			where: { id: orderId },
			data,
		});
	}

	async updateOrderStatus(
		orderId: string,
		status: OrderStatus,
		actor: string = "ADMIN",
	) {
		const result = await prisma.$transaction([
			prisma.order.update({
				where: { id: orderId },
				data: { status },
			}),
			prisma.orderTimelineEvent.create({
				data: {
					orderId,
					status,
					title: `Order ${status.replace(/_/g, " ")}`,
					description: `Order status updated to ${status}`,
					actor,
				},
			}),
		]);
		return result[0];
	}

	async updatePaymentStatus(
		orderId: string,
		paymentStatus: PaymentStatus,
		razorpayData?: {
			razorpayOrderId?: string;
			razorpayPaymentId?: string;
			razorpaySignature?: string;
		},
	) {
		return prisma.order.update({
			where: { id: orderId },
			data: {
				paymentStatus,
				...razorpayData,
			},
		});
	}

	async getAllOrders(filters?: {
		status?: OrderStatus;
		paymentStatus?: PaymentStatus;
		limit?: number;
		offset?: number;
	}) {
		const where: any = {};
		if (filters?.status) where.status = filters.status;
		if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;

		return prisma.order.findMany({
			where,
			include: {
				items: {
					include: {
						product: true,
					},
				},
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: filters?.limit || 50,
			skip: filters?.offset || 0,
		});
	}

	async getProductsByIds(productIds: string[]) {
		return prisma.product.findMany({
			where: { id: { in: productIds } },
			select: {
				id: true,
				name: true,
				price: true,
				discountPrice: true,
				basePrice: true,
				sellingPrice: true,
				slug: true,
				images: true,
				thumbnail: true,
			},
		});
	}

	private generateOrderNumber(): string {
		const timestamp = Date.now().toString(36).toUpperCase();
		const random = Math.random().toString(36).substring(2, 6).toUpperCase();
		return `TRV${timestamp}${random}`;
	}
}

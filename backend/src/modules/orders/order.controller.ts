import type { Request, Response } from "express";
import { OrderService } from "./order.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../middleware/auth.middleware";
import { PaymentMethod } from "@prisma/client";

import { prisma } from "../../config/database";

const orderService = new OrderService();

export class OrderController {
	/**
	 * Create new order
	 */
	async createOrder(req: AuthRequest, res: Response) {
		try {
			const {
				paymentMethod,
				shippingAddress,
				billingAddress,
				customerNotes,
				items,
				deliveryMethod,
				couponCode,
			} = req.body;

			if (!paymentMethod || !shippingAddress) {
				return sendError(
					res,
					"Payment method and shipping address are required",
					400,
				);
			}

			let userId = req.auth?.id;

			// If guest checkout without auth token, resolve or create guest customer user record
			if (!userId) {
				const customerEmail = shippingAddress.email?.toLowerCase().trim();
				const customerPhone = shippingAddress.mobile || shippingAddress.phone;
				const customerName = shippingAddress.fullName || shippingAddress.name || "Guest Customer";

				if (!customerEmail && !customerPhone) {
					return sendError(res, "Customer email or phone is required for checkout", 400);
				}

				// Find existing user or create guest record
				let user = await prisma.user.findFirst({
					where: {
						OR: [
							...(customerEmail ? [{ email: customerEmail }] : []),
							...(customerPhone ? [{ phone: customerPhone }] : []),
						],
					},
				});

				if (!user) {
					user = await prisma.user.create({
						data: {
							name: customerName,
							email: customerEmail || null,
							phone: customerPhone || null,
							passwordHash: "GUEST_CHECKOUT",
							role: "USER",
							status: "ACTIVE",
						},
					});
				}

				userId = user.id;
			}

			const result = await orderService.createOrderFromCart(
				userId,
				paymentMethod as PaymentMethod,
				shippingAddress,
				billingAddress,
				customerNotes,
				undefined, // idempotencyKey
				items, // directItems from frontend
				deliveryMethod,
			);

			return sendSuccess(res, "Order created successfully", result, 201);
		} catch (error: any) {
			console.error("Create order error details:", {
				message: error.message,
				stack: error.stack,
				code: error.code,
				meta: error.meta, // Prisma specific
			});
			return sendError(res, error.message || "Failed to create order");
		}
	}

	/**
	 * Verify Razorpay payment
	 */
	async verifyPayment(req: AuthRequest, res: Response) {
		try {
			const {
				orderId,
				razorpay_order_id,
				razorpay_payment_id,
				razorpay_signature,
			} = req.body;

			if (
				!orderId ||
				!razorpay_order_id ||
				!razorpay_payment_id ||
				!razorpay_signature
			) {
				return sendError(res, "Missing payment verification data", 400);
			}

			const result = await orderService.verifyPayment(
				orderId,
				razorpay_order_id,
				razorpay_payment_id,
				razorpay_signature,
			);

			return sendSuccess(res, "Payment verified successfully", result);
		} catch (error: any) {
			console.error("Verify payment error:", error);
			return sendError(res, error.message || "Payment verification failed");
		}
	}

	/**
	 * Get user's orders
	 */
	async getUserOrders(req: AuthRequest, res: Response) {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "Unauthorized", 401);
			}

			const orders = await orderService.getUserOrders(userId);
			return sendSuccess(res, "Orders retrieved successfully", orders);
		} catch (error) {
			console.error("Get user orders error:", error);
			return sendError(res, "Failed to retrieve orders");
		}
	}

	/**
	 * Get order by ID
	 */
	async getOrderById(req: AuthRequest, res: Response) {
		try {
			const { id } = req.params;
			const order = await (orderService as any).getOrderById(id as string);

			if (!order) {
				return sendError(res, "Order not found", 404);
			}

			// Check if user owns this order or is admin
			if (
				order.userId !== req.auth?.id &&
				req.auth?.role !== "ADMIN" &&
				req.auth?.role !== "SUPER_ADMIN"
			) {
				return sendError(res, "Unauthorized", 403);
			}

			return sendSuccess(res, "Order retrieved successfully", order);
		} catch (error) {
			console.error("Get order error:", error);
			return sendError(res, "Failed to retrieve order");
		}
	}

	/**
	 * Track order by Order Number (Public endpoint with sanitized tracking details)
	 */
	async trackOrderByNumber(req: Request, res: Response) {
		try {
			const { orderNumber } = req.params;
			if (!orderNumber) {
				return sendError(res, "Order number is required", 400);
			}

			const order = await orderService.getOrderByNumber(orderNumber.trim().toUpperCase());
			if (!order) {
				return sendError(res, "Order not found", 404);
			}

			// Public tracking details (sanitized, zero sensitive customer billing data exposed)
			const trackingData = {
				orderNumber: order.orderNumber,
				status: order.status,
				createdAt: order.createdAt,
				estimatedDelivery: order.estimatedDelivery,
				trackingNumber: order.trackingNumber,
				items: (order.items || []).map((item: any) => ({
					name: item.product?.name || "Product",
					quantity: item.quantity,
					price: item.price,
					image: item.product?.thumbnail || item.product?.images?.[0] || null,
				})),
				timeline: order.timeline || [],
				shippingAddress: {
					city: order.shippingAddress?.city,
					state: order.shippingAddress?.state,
					pincode: order.shippingAddress?.pincode,
				},
			};

			return sendSuccess(res, "Order tracking details retrieved", trackingData);
		} catch (error: any) {
			console.error("Track order error:", error);
			return sendError(res, error.message || "Failed to retrieve tracking details");
		}
	}

	/**
	 * Get all orders (Admin only)
	 */
	async getAllOrders(req: AuthRequest, res: Response) {
		try {
			const { status, paymentStatus, limit, offset } = req.query;

			const filters = {
				status: status as any,
				paymentStatus: paymentStatus as any,
				limit: limit ? parseInt(limit as string) : undefined,
				offset: offset ? parseInt(offset as string) : undefined,
			};

			const orders = await orderService.getAllOrders(filters);
			return sendSuccess(res, "Orders retrieved successfully", orders);
		} catch (error) {
			console.error("Get all orders error:", error);
			return sendError(res, "Failed to retrieve orders");
		}
	}

	/**
	 * Update order status (Admin only)
	 */
	async updateOrderStatus(req: AuthRequest, res: Response) {
		try {
			const { id } = req.params;
			const { status } = req.body;

			if (!status) {
				return sendError(res, "Status is required", 400);
			}

			const order = await orderService.updateOrderStatus(
				id as string,
				status,
				req.auth?.email || "ADMIN",
			);
			return sendSuccess(res, "Order status updated successfully", order);
		} catch (error) {
			console.error("Update order status error:", error);
			return sendError(res, "Failed to update order status");
		}
	}
	/**
	 * Update arbitrary order details (Admin only)
	 */
	async updateOrderDetails(req: AuthRequest, res: Response) {
		try {
			const { id } = req.params;
			const { trackingNumber, adminNotes, estimatedDelivery } = req.body;

			const updateData: any = {};
			if (trackingNumber !== undefined)
				updateData.trackingNumber = trackingNumber;
			if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
			if (estimatedDelivery !== undefined)
				updateData.estimatedDelivery = estimatedDelivery
					? new Date(estimatedDelivery)
					: null;

			const order = await orderService.updateOrderDetails(
				id as string,
				updateData,
				req.auth?.email || "ADMIN",
			);
			return sendSuccess(res, "Order details updated successfully", order);
		} catch (error: any) {
			console.error("Update order details error:", error);
			return sendError(res, error.message || "Failed to update order details");
		}
	}
}

import type { Request, Response } from "express";
import { OrderService } from "./order.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../middleware/auth.middleware";
import { PaymentMethod } from "@prisma/client";

const orderService = new OrderService();

export class OrderController {
	/**
	 * Create new order
	 */
	async createOrder(req: AuthRequest, res: Response) {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "Unauthorized", 401);
			}

			const {
				paymentMethod,
				shippingAddress,
				billingAddress,
				customerNotes,
				items,
				deliveryMethod,
			} = req.body;

			if (!paymentMethod || !shippingAddress) {
				return sendError(
					res,
					"Payment method and shipping address are required",
					400,
				);
			}

			const result = await orderService.createOrderFromCart(
				userId,
				paymentMethod as PaymentMethod,
				shippingAddress,
				billingAddress,
				customerNotes,
				undefined, // idempotencyKey (not used from frontend)
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

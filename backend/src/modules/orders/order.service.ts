import { prisma } from '../../config/database';
import { OrderRepository, CreateOrderData } from "./order.repository";
import { PaymentService } from "../payments/payment.service";
import { CartService } from "../cart/cart.service";
import { PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";
import { IdempotencyService } from "../../utils/idempotency";
import { calculateOrderTotals } from "../../utils/pricing";
import { OrderStateMachine } from "./order.state-machine";
import { SocketService } from "../../config/socket";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { env } from "../../config/env";
import { couponService, CouponValidationResult } from "../coupons/coupon.service";

export class OrderService {
	private orderRepo = new OrderRepository();
	private paymentService = new PaymentService();
	private cartService = new CartService();

	/**
	 * Standardized Order normalization resolving static asset canonical URLs
	 */
	private static normalizeOrder(order: any) {
		if (!order) return null;
		const o = { ...order };
		if (o.items && Array.isArray(o.items)) {
			o.items = o.items.map((item: any) => {
				const product = item.product ? { ...item.product } : null;
				if (product) {
					const baseUrl = env.BACKEND_URL || "http://localhost:8080";

					// 1. Qualify thumbnail
					if (
						product.thumbnail &&
						typeof product.thumbnail === "string" &&
						!product.thumbnail.startsWith("http")
					) {
						product.thumbnail = `${baseUrl}${product.thumbnail.startsWith("/") ? "" : "/"}${product.thumbnail}`;
					}

					// 2. Qualify main images array
					if (product.images && Array.isArray(product.images)) {
						product.images = product.images.map((img: any) => {
							if (typeof img === "string" && !img.startsWith("http")) {
								return `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
							}
							return img;
						});
					}
				}
				return { ...item, product };
			});
		}
		return o;
	}

	/**
	 * Create order from cart.
	 * SECURITY: Frontend totals and discount amounts are completely ignored.
	 * All pricing is computed server-side from authoritative product/coupon DB records.
	 */
	async createOrderFromCart(
		userId: string,
		paymentMethod: PaymentMethod,
		shippingAddress: any,
		billingAddress?: any,
		customerNotes?: string,
		idempotencyKey?: string,
		directItems?: { productId: string; quantity: number }[],
		deliveryMethod?: string, // 'SHIP' | 'PICKUP'
		couponCode?: string,
	) {
		// 1. Idempotency Check
		if (idempotencyKey) {
			const existing = await IdempotencyService.check(idempotencyKey);
			if (existing) return existing;
		}

		// 2. Resolve cart items and compute item_total from authoritative product prices
		let cartItems: any[] = [];
		let pricingItems: { price: number; mrp: number; quantity: number }[] = [];

		if (directItems && directItems.length > 0) {
			const productIds = directItems.map((i) => i.productId);
			const products = await this.orderRepo.getProductsByIds(productIds);

			pricingItems = directItems.map((item) => {
				const product = products.find((p) => p.id === item.productId);
				if (!product) throw new Error(`Product not found: ${item.productId}`);
				return {
					price: product.sellingPrice || product.discountPrice || product.price,
					mrp: product.basePrice || product.price * 1.5,
					quantity: item.quantity,
				};
			});

			cartItems = directItems.map((item) => {
				const product = products.find((p) => p.id === item.productId);
				return { productId: item.productId, quantity: item.quantity, product };
			});
		} else {
			const cart = await this.cartService.getUserCart(userId);
			if (!cart.items || cart.items.length === 0)
				throw new Error("Cart is empty");

			pricingItems = cart.items.map((item) => ({
				price: item.product.sellingPrice || item.product.discountPrice || item.product.price,
				mrp: item.product.basePrice || item.product.price * 1.5,
				quantity: item.quantity,
			}));
			cartItems = cart.items;
		}

		const itemTotal = pricingItems.reduce((acc, p) => acc + p.price * p.quantity, 0);

		// 3. Server-Side Coupon Authority Validation
		// Frontend coupon codes are checked but frontend-calculated discounts are NEVER trusted.
		let couponValidation: CouponValidationResult | null = null;
		let couponDiscount = 0;

		if (couponCode && typeof couponCode === "string" && couponCode.trim().length > 0) {
			const result = await couponService.validateCoupon(couponCode, userId, itemTotal);
			if (!result.valid) {
				throw new Error(`Coupon error: ${(result as any).reason}`);
			}
			couponValidation = result;
			couponDiscount = result.isFreeShipping ? 0 : result.discountAmount;
		}

		// 4. Calculate authoritative order totals (couponDiscount is server-computed, not frontend-trusted)
		const totals = calculateOrderTotals(pricingItems, deliveryMethod, couponDiscount);

		return this.finalizeOrderCreation(
			userId,
			paymentMethod,
			shippingAddress,
			billingAddress,
			customerNotes,
			idempotencyKey,
			cartItems,
			totals,
			deliveryMethod,
			couponValidation,
		);
	}


	private async finalizeOrderCreation(
		userId: string,
		paymentMethod: PaymentMethod,
		shippingAddress: any,
		billingAddress: any,
		customerNotes: string | undefined,
		idempotencyKey: string | undefined,
		cartItems: any[],
		totals: any,
		deliveryMethod?: string, // 'SHIP' | 'PICKUP'
		couponValidation?: CouponValidationResult | null,
	) {
		// Phase 4: SLA Calculation (PACKED within 6h)
		const slaDeadline = new Date(Date.now() + 6 * 60 * 60 * 1000);

		// Calculate estimated delivery (e.g., 5-7 days)
		const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

		// Prepare order data
		const orderData: any = {
			userId,
			items: cartItems.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
				price:
					item.product.sellingPrice ||
					item.product.discountPrice ||
					item.product.price,
				discount:
					(item.product.basePrice || item.product.price * 1.5) -
					(item.product.sellingPrice ||
						item.product.discountPrice ||
						item.product.price),
				subtotal:
					(item.product.sellingPrice ||
						item.product.discountPrice ||
						item.product.price) * item.quantity,
			})),
			subtotal: totals.item_total,
			discount: totals.discount_total,
			tax: totals.tax, // 3% GST
			shippingCharge: totals.shipping,
			total: totals.final_payable,
			metadata: {
				platform_fee: totals.platform_fee,
				cash_roundoff: totals.cash_roundoff,
				mrp_total: totals.mrp_total,
				total_saved: totals.total_saved,
			},
			paymentMethod,
			shippingAddress,
			billingAddress,
			customerNotes,
			slaDeadline,
			estimatedDelivery,
			idempotencyKey,
			// Coupon tracking fields
			...(couponValidation ? {
				couponCode: couponValidation.code,
				couponId: couponValidation.couponId,
				couponDiscount: couponValidation.discountAmount,
			} : {}),
		};

		// Create order (inventory deduction uses SELECT FOR UPDATE inside createOrder)
		let order: any;
		try {
			order = await this.orderRepo.createOrder(orderData);
		} catch (err: any) {
			if (idempotencyKey && (err.code === "P2002" || err.message?.includes("idempotencyKey"))) {
				const existing = await IdempotencyService.check(idempotencyKey);
				if (existing) {
					console.log(`[OrderService] Concurrent idempotency collision resolved cleanly for key: ${idempotencyKey}`);
					return { order: existing, isDuplicate: true };
				}
			}
			throw err;
		}

		// Apply coupon usage atomically in a separate transaction
		// (AFTER order is committed, so partial failure rolls back coupon increment separately)
		if (couponValidation) {
			try {
				await prisma.$transaction(async (tx) => {
					await couponService.applyCouponInTransaction(
						tx,
						couponValidation.couponId,
						couponValidation.code,
						order.id,
						userId,
						couponValidation.discountAmount,
					);
				});
			} catch (couponErr: any) {
				// Log but don't fail the order - order is already committed
				// Reconciliation can handle this edge case
				console.error("[OrderService] Coupon usage tracking failed after order creation:", couponErr.message, { orderId: order.id, couponCode: couponValidation.code });
			}
		}

		// Formalize Domain Event
		eventBus.emitDomainEvent(DomainEvent.ORDER_CREATED, order);

		// ── PRICING GUARD: log full breakdown before Razorpay order creation ──
		console.log(
			"[OrderService] Pricing breakdown:",
			JSON.stringify({
				item_total: totals.item_total,
				platform_fee: totals.platform_fee,
				tax: totals.tax,
				shipping: totals.shipping,
				grand_total: totals.grand_total,
				cash_roundoff: totals.cash_roundoff,
				final_payable: totals.final_payable,
				razorpay_paise: Math.round(totals.final_payable * 100),
			}),
		);

		// Guard: final_payable must be a positive finite number
		if (!Number.isFinite(totals.final_payable) || totals.final_payable < 1) {
			throw new Error(
				`[PaymentGuard] Invalid final_payable: ${totals.final_payable}`,
			);
		}

		// Online payment methods (RAZORPAY, CARD, UPI) require Razorpay order creation & server-side verification
		const isOnlinePayment =
			paymentMethod === PaymentMethod.RAZORPAY ||
			paymentMethod === PaymentMethod.CARD ||
			paymentMethod === PaymentMethod.UPI;

		if (isOnlinePayment) {
			const amountForRazorpay = totals.final_payable;
			console.log(
				`[OrderService] Creating Razorpay order for ₹${amountForRazorpay} (${Math.round(amountForRazorpay * 100)} paise)`,
			);
			const razorpayOrder = await this.paymentService.createOrder(
				amountForRazorpay,
				"INR",
				order.orderNumber,
			);
			await this.orderRepo.updatePaymentStatus(
				order.id,
				PaymentStatus.PENDING,
				{ razorpayOrderId: razorpayOrder.id },
			);
			await this.updateOrderStatus(
				order.id,
				OrderStatus.PAYMENT_PENDING,
				"SYSTEM",
			);
			await this.cartService.clearUserCart(userId);

			SocketService.emitToUser(userId, "order:created", order);
			SocketService.emitToAdmins("order:created", order);

			return {
				order,
				razorpayOrder,
				razorpayKeyId: env.RAZORPAY_KEY_ID,
			};
		}

		await this.orderRepo.updatePaymentStatus(order.id, PaymentStatus.PENDING);
		await this.updateOrderStatus(
			order.id,
			OrderStatus.PAYMENT_PENDING,
			"SYSTEM",
		);
		await this.cartService.clearUserCart(userId);

		SocketService.emitToUser(userId, "order:created", order);
		SocketService.emitToAdmins("order:created", order);

		return { order };
	}

	/**
	 * Verify payment and update order
	 */
	async verifyPayment(
		orderId: string,
		razorpayOrderId: string,
		razorpayPaymentId: string,
		razorpaySignature: string,
	) {
		const isValid = this.paymentService.verifyPaymentSignature(
			razorpayOrderId,
			razorpayPaymentId,
			razorpaySignature,
		);

		if (!isValid) {
			await this.orderRepo.updatePaymentStatus(orderId, PaymentStatus.FAILED);
			await this.updateOrderStatus(orderId, OrderStatus.FAILED, "SYSTEM");
			throw new Error("Payment verification failed");
		}

		await this.orderRepo.updatePaymentStatus(orderId, PaymentStatus.COMPLETED, {
			razorpayPaymentId,
			razorpaySignature,
		});

		await this.updateOrderStatus(
			orderId,
			OrderStatus.PAYMENT_CONFIRMED,
			"SYSTEM",
		);
		const updatedOrder = await this.updateOrderStatus(orderId, OrderStatus.PROCESSING, "SYSTEM");

		return {
			success: true,
			message: "Payment verified successfully",
			order: updatedOrder,
		};
	}

	/**
	 * Get user's orders
	 */
	async getUserOrders(userId: string) {
		const orders = await this.orderRepo.getUserOrders(userId);
		return (orders || []).map((o) => OrderService.normalizeOrder(o));
	}

	/**
	 * Update order status (Admin)
	 */
	async updateOrderStatus(
		orderId: string,
		status: OrderStatus,
		actor?: string,
	) {
		const order = await this.orderRepo.getOrderById(orderId);
		if (!order) throw new Error("Order not found");

		if (!OrderStateMachine.isValidTransition(order.status, status)) {
			throw new Error(
				`Invalid status transition from ${order.status} to ${status}`,
			);
		}

		// USE GLOBAL ORCHESTRATOR ENGINE (Phase 2/7 Convergence)
		const {
			fulfillmentOrchestrator,
		} = require("../logistics/fulfillment-orchestrator.service");
		const updatedOrder =
			await fulfillmentOrchestrator.orchestrateFulfillmentTransition(
				orderId,
				status,
				{
					actor: actor || "SYSTEM_DAEMON",
					notes: `Auto-transition mandated by domain workflow.`,
				},
			);

		// Legacy Domain Event Map (Maintain system hook compatibility)
		const eventMap: Partial<Record<OrderStatus, DomainEvent>> = {
			PAYMENT_CONFIRMED: DomainEvent.PAYMENT_CONFIRMED,
			PROCESSING: DomainEvent.ORDER_PROCESSING,
			PACKED: DomainEvent.ORDER_PACKED,
			SHIPPED: DomainEvent.ORDER_SHIPPED,
			OUT_FOR_DELIVERY: DomainEvent.OUT_FOR_DELIVERY,
			DELIVERED: DomainEvent.ORDER_DELIVERED,
			COMPLETED: DomainEvent.ORDER_COMPLETED,
			CANCELLED: DomainEvent.ORDER_CANCELLED,
			// Logistics Map Extensions
			PICKUP_PENDING: DomainEvent.PICKUP_PENDING,
			PICKUP_ASSIGNED: DomainEvent.PICKUP_ASSIGNED,
			PICKUP_CONFIRMED: DomainEvent.PICKUP_CONFIRMED,
			PICKUP_COMPLETED: DomainEvent.PICKUP_COMPLETED,
			IN_TRANSIT: DomainEvent.IN_TRANSIT,
			DELIVERY_FAILED: DomainEvent.DELIVERY_FAILED,
			RETURN_INITIATED: DomainEvent.RETURN_INITIATED,
			RETURN_COMPLETED: DomainEvent.RETURN_COMPLETED,
		};

		const domainEvent = eventMap[status];
		if (domainEvent) {
			eventBus.emitDomainEvent(domainEvent, updatedOrder);
		}

		// Legacy Socket emits
		SocketService.emitToOrder(orderId, "order:updated", updatedOrder);
		SocketService.emitToUser(order.userId, "order:updated", updatedOrder);
		SocketService.emitToAdmins("order:updated", updatedOrder);

		// Predictive AI ETA Update (Simulation)
		if (status === "SHIPPED") {
			const shortenedETA = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from shipping
			await this.orderRepo.updateEstimatedDelivery(orderId, shortenedETA);
		}

		return updatedOrder;
	}

	/**
	 * Update arbitrary order details (tracking, notes, etc.)
	 */
	async updateOrderDetails(
		orderId: string,
		data: {
			trackingNumber?: string;
			adminNotes?: string;
			estimatedDelivery?: Date;
		},
		actor: string = "ADMIN",
	) {
		const order = await this.orderRepo.getOrderById(orderId);
		if (!order) throw new Error("Order not found");

		const updated = await this.orderRepo.updateOrderDetails(orderId, data);

		// Notify dynamic update socket so the UI stays fresh
		SocketService.emitToAdmins("order:updated", updated);
		SocketService.emitToUser(order.userId, "order:updated", updated);

		return updated;
	}

	/**
	 * Get all orders (Admin)
	 */
	async getAllOrders(filters?: any) {
		return this.orderRepo.getAllOrders(filters);
	}

	/**
	 * Get order by ID
	 */
	async getOrderById(orderId: string) {
		const order = await this.orderRepo.getOrderById(orderId);
		return OrderService.normalizeOrder(order);
	}

	/**
	 * Get order by Order Number (Public Tracking)
	 */
	async getOrderByNumber(orderNumber: string) {
		const order = await this.orderRepo.getOrderByNumber(orderNumber);
		return OrderService.normalizeOrder(order);
	}
}

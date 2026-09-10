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
	 * Create order from cart
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
	) {
		// 1. Idempotency Check
		if (idempotencyKey) {
			const existing = await IdempotencyService.check(idempotencyKey);
			if (existing) return existing;
		}

		let cartItems: any[] = [];
		let cartSubtotal = 0;
		let cartTotal = 0;
		let cartTax = 0;

		if (directItems && directItems.length > 0) {
			const productIds = directItems.map((i) => i.productId);
			const products = await this.orderRepo.getProductsByIds(productIds);

			const pricingItems = directItems.map((item) => {
				const product = products.find((p) => p.id === item.productId);
				if (!product) throw new Error(`Product not found: ${item.productId}`);
				return {
					price: product.sellingPrice || product.discountPrice || product.price,
					mrp: product.basePrice || product.price * 1.5,
					quantity: item.quantity,
				};
			});

			const totals = calculateOrderTotals(pricingItems, deliveryMethod);
			cartItems = directItems.map((item) => {
				const product = products.find((p) => p.id === item.productId);
				return { productId: item.productId, quantity: item.quantity, product };
			});

			// Map totals back to local variables expected by the prepared order Data
			cartSubtotal = totals.item_total;
			const totalsObj = totals; // for easier access

			// We'll use the totals directly in the orderData preparation
			const orderTotals = totals;
			return this.finalizeOrderCreation(
				userId,
				paymentMethod,
				shippingAddress,
				billingAddress,
				customerNotes,
				idempotencyKey,
				cartItems,
				orderTotals,
				deliveryMethod,
			);
		} else {
			const cart = await this.cartService.getUserCart(userId);
			if (!cart.items || cart.items.length === 0)
				throw new Error("Cart is empty");

			const pricingItems = cart.items.map((item) => ({
				price:
					item.product.sellingPrice ||
					item.product.discountPrice ||
					item.product.price,
				mrp: item.product.basePrice || item.product.price * 1.5,
				quantity: item.quantity,
			}));
			const totals = calculateOrderTotals(pricingItems, deliveryMethod);

			return this.finalizeOrderCreation(
				userId,
				paymentMethod,
				shippingAddress,
				billingAddress,
				customerNotes,
				idempotencyKey,
				cart.items,
				totals,
				deliveryMethod,
			);
		}
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
		};

		// Create order
		const order = await this.orderRepo.createOrder(orderData);

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

		// If Razorpay, create payment order
		if (paymentMethod === PaymentMethod.RAZORPAY) {
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
			await this.cartService.clearUserCart(userId);

			SocketService.emitToUser(userId, "order:created", order);
			SocketService.emitToAdmins("order:created", order);

			return {
				order,
				razorpayOrder,
				razorpayKeyId: process.env.RAZORPAY_KEY_ID,
			};
		}

		if (paymentMethod === PaymentMethod.CARD) {
			await this.orderRepo.updatePaymentStatus(
				order.id,
				PaymentStatus.COMPLETED,
			);
			await this.updateOrderStatus(
				order.id,
				OrderStatus.PAYMENT_CONFIRMED,
				"SYSTEM",
			);
			await this.updateOrderStatus(order.id, OrderStatus.PROCESSING, "SYSTEM");
			await this.cartService.clearUserCart(userId);
			return { order };
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

		const updatedOrder = await this.updateOrderStatus(
			orderId,
			OrderStatus.PAYMENT_CONFIRMED,
			"SYSTEM",
		);
		await this.updateOrderStatus(orderId, OrderStatus.PROCESSING, "SYSTEM");

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

import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

// ---------------------------------------------------------------------------
// Error-code → user-friendly message matrix (spec §5.5)
// ---------------------------------------------------------------------------
const RAZORPAY_ERROR_MAP: Record<string, string> = {
	BAD_REQUEST_ERROR: "Invalid payment details. Please check and try again.",
	GATEWAY_ERROR: "Payment gateway is temporarily unavailable. Please retry.",
	NETWORK_ERROR: "Network connectivity issue. Please check your connection.",
	SERVER_ERROR:
		"Our payment server is temporarily busy. Please retry after 30 seconds.",
	PAYMENT_FAILED:
		"Payment was declined. Please try a different payment method.",
};

// ---------------------------------------------------------------------------
// Amount validation (spec §6.1)
// ---------------------------------------------------------------------------
export const validatePaymentAmount = (amount: number): void => {
	if (!Number.isFinite(amount))
		throw new Error("Invalid amount: must be a number");
	if (amount < 1) throw new Error("Minimum payable amount is ₹1");
	if (amount > 1_000_000)
		throw new Error("Maximum payable amount is ₹10,00,000");
};

// ---------------------------------------------------------------------------
// Razorpay Order-ID format guard
// ---------------------------------------------------------------------------
export const validateRazorpayOrderId = (orderId: string): void => {
	if (!/^order_[A-Za-z0-9]{14}$/.test(orderId)) {
		throw new Error("Invalid Razorpay order ID format");
	}
};

// ---------------------------------------------------------------------------
// PaymentService
// ---------------------------------------------------------------------------
export class PaymentService {
	private razorpay: Razorpay;

	constructor() {
		this.razorpay = new Razorpay({
			key_id: env.RAZORPAY_KEY_ID || "",
			key_secret: env.RAZORPAY_KEY_SECRET || "",
		});
	}

	// ─── Create Razorpay order ───────────────────────────────────────────────
	async createOrder(
		amount: number,
		currency: string = "INR",
		receipt: string,
		notes?: Record<string, string>,
	) {
		try {
			validatePaymentAmount(amount);

			const options = {
				amount: Math.round(amount * 100), // INR → paise
				currency,
				receipt,
				notes: notes ?? {},
				payment_capture: 1 as 1, // auto-capture
			};

			const order = await this.razorpay.orders.create(options);
			logger.info(`[Payment] Razorpay order created: ${order.id} ₹${amount}`);
			return order;
		} catch (error: any) {
			const friendlyMsg =
				RAZORPAY_ERROR_MAP[error?.error?.code] ??
				"Failed to create payment order";
			logger.error(`[Payment] Order creation error: ${error.message}`);
			throw new Error(friendlyMsg);
		}
	}

	// ─── Verify payment signature (spec §3.3) ────────────────────────────────
	verifyPaymentSignature(
		razorpayOrderId: string,
		razorpayPaymentId: string,
		signature: string,
	): boolean {
		try {
			const text = `${razorpayOrderId}|${razorpayPaymentId}`;
			const secret = env.RAZORPAY_KEY_SECRET || "";
			const generated = crypto
				.createHmac("sha256", secret)
				.update(text)
				.digest("hex");

			const isValid = generated === signature;
			if (!isValid) {
				logger.warn(
					`[Payment] Signature mismatch for order ${razorpayOrderId}`,
				);
			}
			return isValid;
		} catch (error) {
			logger.error("[Payment] Signature verification error:", error);
			return false;
		}
	}

	// ─── Verify incoming webhook signature (spec §3.4) ───────────────────────
	verifyWebhookSignature(rawBody: string, incomingSignature: string): boolean {
		try {
			const secret = env.RAZORPAY_WEBHOOK_SECRET || "";
			const generated = crypto
				.createHmac("sha256", secret)
				.update(rawBody)
				.digest("hex");

			return generated === incomingSignature;
		} catch {
			return false;
		}
	}

	// ─── Fetch payment details from Razorpay ─────────────────────────────────
	async getPaymentDetails(paymentId: string) {
		try {
			const payment = await this.razorpay.payments.fetch(paymentId);
			return {
				id: payment.id,
				amount: (payment.amount as number) / 100, // paise → INR
				currency: payment.currency,
				status: payment.status,
				method: payment.method,
				email: payment.email,
				contact: payment.contact,
				created_at: payment.created_at,
			};
		} catch (error: any) {
			logger.error(`[Payment] Fetch payment error: ${error.message}`);
			throw new Error("Failed to fetch payment details");
		}
	}

	// ─── Refund (full or partial) ─────────────────────────────────────────────
	async refundPayment(paymentId: string, amount?: number) {
		try {
			const refundData: Record<string, any> = {};
			if (amount !== undefined) {
				validatePaymentAmount(amount);
				refundData.amount = Math.round(amount * 100);
			}

			const refund = await this.razorpay.payments.refund(paymentId, refundData);
			logger.info(
				`[Payment] Refund created: ${refund.id} for payment ${paymentId}`,
			);
			return refund;
		} catch (error: any) {
			logger.error(`[Payment] Refund error: ${error.message}`);
			throw new Error("Failed to process refund");
		}
	}
}

import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { env } from "../../../config/env";
import { PaymentService } from "../payment.service";

describe("PaymentService signature & webhook security", () => {
	it("rejects forged payment signatures when RAZORPAY_KEY_SECRET is unset", () => {
		const prev = env.RAZORPAY_KEY_SECRET;
		try {
			(env as any).RAZORPAY_KEY_SECRET = undefined;
			const svc = new PaymentService();
			const emptyForged = crypto
				.createHmac("sha256", "")
				.update("order_test1234567890|pay_test123")
				.digest("hex");
			expect(
				svc.verifyPaymentSignature("order_test1234567890", "pay_test123", emptyForged),
			).toBe(false);
		} finally {
			(env as any).RAZORPAY_KEY_SECRET = prev;
		}
	});

	it("verifies valid Razorpay payment HMAC-SHA256 signatures and rejects tampered ones", () => {
		const prev = env.RAZORPAY_KEY_SECRET;
		try {
			(env as any).RAZORPAY_KEY_SECRET = "rzp_test_secret_unit_key_32chars";
			const svc = new PaymentService();
			const validSig = crypto
				.createHmac("sha256", "rzp_test_secret_unit_key_32chars")
				.update("order_AbCdEf12345678|pay_XyZ987654321")
				.digest("hex");
			expect(
				svc.verifyPaymentSignature("order_AbCdEf12345678", "pay_XyZ987654321", validSig),
			).toBe(true);
			expect(
				svc.verifyPaymentSignature("order_AbCdEf12345678", "pay_TAMPERED", validSig),
			).toBe(false);
		} finally {
			(env as any).RAZORPAY_KEY_SECRET = prev;
		}
	});

	it("rejects webhook signatures when RAZORPAY_WEBHOOK_SECRET is unset and accepts valid HMAC", () => {
		const prev = env.RAZORPAY_WEBHOOK_SECRET;
		const raw = JSON.stringify({ event: "payment.captured", event_id: "evt_1" });
		try {
			(env as any).RAZORPAY_WEBHOOK_SECRET = undefined;
			const svc = new PaymentService();
			const forged = crypto.createHmac("sha256", "").update(raw).digest("hex");
			expect(svc.verifyWebhookSignature(raw, forged)).toBe(false);

			(env as any).RAZORPAY_WEBHOOK_SECRET = "whsec_unit_test_secret_key";
			const valid = crypto
				.createHmac("sha256", "whsec_unit_test_secret_key")
				.update(raw)
				.digest("hex");
			expect(svc.verifyWebhookSignature(raw, valid)).toBe(true);
			expect(svc.verifyWebhookSignature(raw, "deadbeef")).toBe(false);
		} finally {
			(env as any).RAZORPAY_WEBHOOK_SECRET = prev;
		}
	});
});

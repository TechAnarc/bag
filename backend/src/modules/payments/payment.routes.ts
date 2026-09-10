import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import { PaymentController } from "./payment.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();
const paymentController = new PaymentController();

// ─── Rate limits ──────────────────────────────────────────────────────────────
const paymentCreateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: {
		success: false,
		message: "Too many payment attempts. Please try again in 15 minutes.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// ─── Raw body capture for webhook HMAC ───────────────────────────────────────
// CRITICAL: Must run BEFORE express.json() — payment.routes is mounted first in index.ts
const rawBodyCapture = (req: Request, res: Response, next: NextFunction) => {
	express.raw({ type: "application/json" })(req, res, (err) => {
		if (err) return next(err);
		(req as any).rawBody = req.body?.toString("utf8") ?? "";
		next();
	});
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/payments/webhook
 * Public — Razorpay calls this directly.
 * Signature verification mandatory. Raw body capture required.
 */
router.post("/webhook", rawBodyCapture, (req, res) =>
	paymentController.handleWebhook(req, res),
);

/**
 * GET /api/v1/payments/webhook/health
 * Public operational endpoint for monitoring.
 */
router.get("/webhook/health", (req, res) =>
	paymentController.getWebhookHealth(req, res),
);

/**
 * GET /api/v1/payments/webhook/registry
 * Admin only — list all registered event types.
 */
router.get(
	"/webhook/registry",
	authenticate,
	authorize(Role.ADMIN),
	(req, res) => paymentController.getRegisteredEvents(req as any, res),
);

/**
 * GET /api/v1/payments/:paymentId
 * Admin only — fetch live payment details from Razorpay.
 */
router.get("/:paymentId", authenticate, authorize(Role.ADMIN), (req, res) =>
	paymentController.getPaymentDetails(req as any, res),
);

/**
 * POST /api/v1/payments/:paymentId/refund
 * Admin only — initiate full or partial refund.
 */
router.post(
	"/:paymentId/refund",
	authenticate,
	authorize(Role.ADMIN),
	(req, res) => paymentController.refundPayment(req as any, res),
);

export { paymentCreateLimiter };
export default router;

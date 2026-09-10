import { Router } from "express";
import { OrderController } from "./order.controller";
import { authenticate, optionalAuthenticate, authorize } from "../../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();
const orderController = new OrderController();

// Public tracking route (no auth required)
router.get("/track/:orderNumber", (req, res) =>
	orderController.trackOrderByNumber(req, res),
);

// Order placement & payment verification accept registered or guest checkouts
router.post("/", optionalAuthenticate, (req, res) =>
	orderController.createOrder(req, res),
);
router.post("/verify-payment", optionalAuthenticate, (req, res) =>
	orderController.verifyPayment(req, res),
);

// Authenticated user routes
router.get("/my-orders", authenticate, (req, res) =>
	orderController.getUserOrders(req, res),
);
router.get("/:id", authenticate, (req, res) =>
	orderController.getOrderById(req, res),
);

// Admin routes
router.get("/", authorize(Role.ADMIN), (req, res) =>
	orderController.getAllOrders(req, res),
);
router.patch("/:id/status", authorize(Role.ADMIN), (req, res) =>
	orderController.updateOrderStatus(req, res),
);
router.patch("/:id/details", authorize(Role.ADMIN), (req, res) =>
	orderController.updateOrderDetails(req, res),
);

export default router;

import { Router } from "express";
import { OrderController } from "./order.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();
const orderController = new OrderController();

// All order routes require authentication
router.use(authenticate);

// User routes
router.post("/", (req, res) => orderController.createOrder(req, res));
router.post("/verify-payment", (req, res) =>
	orderController.verifyPayment(req, res),
);
router.get("/my-orders", (req, res) => orderController.getUserOrders(req, res));
router.get("/:id", (req, res) => orderController.getOrderById(req, res));

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

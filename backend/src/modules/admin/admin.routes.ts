import { Router } from "express";
import {
	authenticateAdmin,
	requireSuperAdmin,
} from "../../middleware/adminAuth.middleware";
import { AdminController } from "./admin.controller";

const router = Router();
const adminController = new AdminController();

// ==================== Public Routes ====================
router.post("/auth/login", adminController.login.bind(adminController));
router.post(
	"/auth/google-login",
	adminController.googleLogin.bind(adminController),
);
router.post("/auth/refresh", adminController.refresh.bind(adminController));
router.post("/auth/logout", adminController.logout.bind(adminController));

// ==================== Protected Routes (All Admins) ====================
router.use(authenticateAdmin); // Apply authentication middleware to all routes below

// Profile Management
router.get("/profile", adminController.getProfile.bind(adminController));
router.put("/profile", adminController.updateProfile.bind(adminController));
router.put(
	"/profile/password",
	adminController.updatePassword.bind(adminController),
);
router.post(
	"/mobile/register-device",
	adminController.registerDevice.bind(adminController),
);

// Dashboard
router.get(
	"/stats/dashboard",
	adminController.getDashboardStats.bind(adminController),
);
router.get("/stats/charts", adminController.getChartData.bind(adminController));
router.get("/analytics", adminController.getAnalytics.bind(adminController));
router.get(
	"/surveillance/metrics",
	adminController.getSurveillanceMetrics.bind(adminController),
);

// User Management
router.get("/users", adminController.getUsers.bind(adminController));
router.put(
	"/users/:userId/block",
	adminController.blockUser.bind(adminController),
);
router.put(
	"/users/:userId/unblock",
	adminController.unblockUser.bind(adminController),
);

// Order Management
router.get("/orders", adminController.getOrders.bind(adminController));
router.get(
	"/orders/operational",
	adminController.getOperationalOrders.bind(adminController),
);
router.put(
	"/orders/:orderId/status",
	adminController.updateOrderStatus.bind(adminController),
);
router.put(
	"/orders/:orderId/details",
	adminController.updateOrderDetails.bind(adminController),
);

// Product Management
router.get("/products", adminController.getProducts.bind(adminController));
router.post("/products", adminController.createProduct.bind(adminController));
router.put(
	"/products/:productId",
	adminController.updateProduct.bind(adminController),
);
router.delete(
	"/products/:productId",
	adminController.deleteProduct.bind(adminController),
);

// ==================== Phase 3: Autonomy & Logistics ====================
import { AutonomyController } from "../automation/autonomy.controller";
import { LogisticsController } from "../logistics/logistics.controller";

const autonomyController = new AutonomyController();
const logisticsController = new LogisticsController();

// Autonomous Decision Engine (ADE)
router.get(
	"/autonomy/decisions",
	autonomyController.getDecisionStream.bind(autonomyController),
);
router.get(
	"/autonomy/policies",
	autonomyController.getPolicies.bind(autonomyController),
);
router.put(
	"/autonomy/policies/:id",
	autonomyController.updatePolicy.bind(autonomyController),
);
router.post(
	"/autonomy/decisions/:id/override",
	autonomyController.overrideDecision.bind(autonomyController),
);

// Logistics Partner Network (15+ Partners)
router.get(
	"/logistics/partners",
	logisticsController.getPartners.bind(logisticsController),
);
router.get(
	"/logistics/partners/:id/performance",
	logisticsController.getPartnerPerformance.bind(logisticsController),
);
router.post(
	"/logistics/partners",
	logisticsController.createPartner.bind(logisticsController),
);
router.post(
	"/logistics/shipments/manifest",
	logisticsController.manifestShipment.bind(logisticsController),
);

import multer from "multer";
// Inquiries (Directly integrated from Contact Module)
import { ContactController } from "../contact/contact.controller";

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
});

const contactController = new ContactController();
router.get(
	"/inquiries",
	contactController.getAllSubmissions.bind(contactController),
);
router.patch(
	"/inquiries/:id/read",
	contactController.markAsRead.bind(contactController),
);
router.post(
	"/inquiries/:id/reply",
	upload.array("attachments"),
	contactController.sendReply.bind(contactController),
);

// Activity Logs
router.get("/logs", adminController.getActivityLogs.bind(adminController));

// Mission Control Commands
router.post(
	"/commands/:commandType",
	adminController.executeCommand.bind(adminController),
);

// Business Settings
router.get(
	"/settings/business",
	adminController.getBusinessConfig.bind(adminController),
);
router.put(
	"/settings/business",
	adminController.updateBusinessConfig.bind(adminController),
);

// ==================== Super Admin Only Routes ====================
// Add super admin only routes here if needed
// Example: router.post("/admins", requireSuperAdmin, ...);

export default router;

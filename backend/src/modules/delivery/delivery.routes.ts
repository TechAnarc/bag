import { Router } from "express";
import { DeliveryController } from "./delivery.controller";

const router = Router();
const deliveryController = new DeliveryController();

// Real-time location tracking
router.post("/:agentId/location", deliveryController.updateLocation);

// Agent Dashboard info
router.get("/:agentId/dashboard", deliveryController.getDashboard);

// Status updates
router.post("/:agentId/status-update", deliveryController.updateStatus);

// Admin Action: Assign order to agent
router.post("/assign", deliveryController.assignOrder);

export default router;

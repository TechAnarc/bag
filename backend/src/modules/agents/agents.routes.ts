import { Router } from "express";
import { agentsController } from "./agents.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authenticateAdmin } from "../../middleware/adminAuth.middleware";

const router = Router();

// Customer-facing Agentic Support Interface
router.post("/support", authenticate, (req, res) =>
	agentsController.customerSupport(req, res),
);

// Admin Copilot – requires admin auth
router.post("/admin/copilot", authenticateAdmin, (req, res) =>
	agentsController.adminCopilot(req, res),
);

// Transcript retrieval (admin-governed)
router.get("/sessions/:id", authenticateAdmin, (req, res) =>
	agentsController.getSession(req, res),
);

export const agentsRoutes = router;

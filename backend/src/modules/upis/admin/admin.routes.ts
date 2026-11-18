import { Router } from "express";
import { adminIntelligenceController } from "./admin-intelligence.controller";
import { authenticateAdmin } from "../../../middleware/adminAuth.middleware";

const router = Router();

router.use(authenticateAdmin);

/**
 * @route GET /api/v1/admin/upis/users
 */
router.get("/users", adminIntelligenceController.listUsers);
router.get("/visitor-radar", adminIntelligenceController.getVisitorRadar);
router.get("/users/:id/intelligence", adminIntelligenceController.getUser360);

export default router;

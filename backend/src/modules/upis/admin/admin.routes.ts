import { Router } from "express";
import { adminIntelligenceController } from "./admin-intelligence.controller";
// import { authenticate, authorize } from '../../../middleware/auth.middleware';

const router = Router();

// router.use(authenticate, authorize(['ADMIN']));

/**
 * @route GET /api/v1/admin/upis/users
 */
router.get("/users", adminIntelligenceController.listUsers);
router.get("/visitor-radar", adminIntelligenceController.getVisitorRadar);
router.get("/users/:id/intelligence", adminIntelligenceController.getUser360);

export default router;

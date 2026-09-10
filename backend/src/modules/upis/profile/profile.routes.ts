import { Router } from "express";
import { profileController } from "./profile.controller";
// import { authenticate } from '../../../middleware/auth.middleware';

const router = Router();

// router.use(authenticate); // Applied to all profile routes

/**
 * @route GET /api/v1/profile/me
 */
router.get("/me", profileController.getMe);

/**
 * @route PUT /api/v1/profile/me
 */
router.put("/me", profileController.updateMe);

/**
 * @route GET /api/v1/profile/activity
 */
router.get("/activity", profileController.getMyActivity);

export default router;

import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { updateProfileSchema, changePasswordSchema } from "./profile.schema";

const router = Router();
const profileController = new ProfileController();

// All routes require authentication
router.use(authenticate);

// Get current user profile & hub data
router.get("/me", profileController.getProfile);

// Update profile basic info
router.put("/", profileController.updateProfile);

// Address Book CRUD
router.post("/addresses", profileController.addAddress);
router.put("/addresses/:addressId", profileController.updateAddress);
router.delete("/addresses/:addressId", profileController.deleteAddress);

// Security & Settings
router.put("/security", profileController.updateSecurity);
router.post("/change-password", profileController.changePassword);

// Delete account
router.delete("/", profileController.deleteAccount);

export default router;

import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const authController = new AuthController();

// Direct Auth (no OTP verification)
router.post("/register", authController.register);
router.post("/login", authController.login);

// Unified Identity Gateway (Mobile + OTP)
router.post("/request-otp", authController.requestMobileOTP);
router.post("/verify-otp", authController.verifyMobileOTP);

// Next-Gen Gateway (Google & Supabase Resilience)
router.post("/google-login", authController.googleAuth);
router.post("/supabase-login", authController.supabaseAuth);

// Token management
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;

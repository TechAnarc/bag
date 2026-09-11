import { Router } from "express";
import { couponController } from "./coupon.controller";
import { authenticateAdmin } from "../../middleware/adminAuth.middleware";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// Public: validate coupon (requires user auth)
router.post("/validate", authenticate as any, (req, res) => couponController.validateCoupon(req as any, res));

// Admin: full CRUD (requires admin auth)
router.use(authenticateAdmin);
router.post("/", (req, res) => couponController.createCoupon(req, res));
router.get("/", (req, res) => couponController.listCoupons(req, res));
router.get("/:id", (req, res) => couponController.getCoupon(req, res));
router.put("/:id", (req, res) => couponController.updateCoupon(req, res));
router.patch("/:id/toggle", (req, res) => couponController.toggleStatus(req, res));
router.delete("/:id", (req, res) => couponController.deleteCoupon(req, res));

export default router;

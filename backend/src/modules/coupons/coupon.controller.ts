import type { Request, Response } from "express";
import { couponService } from "./coupon.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../middleware/auth.middleware";
import { CouponType } from "@prisma/client";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  value: z.number().min(0),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  description: z.string().max(500).optional(),
});

const validateCouponSchema = z.object({
  code: z.string().min(1),
  itemTotal: z.number().positive(),
});

export class CouponController {
  async createCoupon(req: Request, res: Response) {
    try {
      const adminId = (req as any).admin?.id;
      if (!adminId) return sendError(res, "Unauthorized", 401);
      const parsed = createCouponSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, parsed.error.errors.map(e => e.message).join(", "), 400);
      const d = parsed.data;
      const coupon = await couponService.createCoupon({
        code: d.code,
        type: d.type as CouponType,
        value: d.value,
        maxDiscount: d.maxDiscount,
        minOrderValue: d.minOrderValue,
        usageLimit: d.usageLimit,
        perCustomerLimit: d.perCustomerLimit,
        isActive: d.isActive,
        validFrom: d.validFrom ? new Date(d.validFrom) : undefined,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined,
        description: d.description,
      }, adminId);
      return sendSuccess(res, "Coupon created", coupon, 201);
    } catch (e: any) { return sendError(res, e.message); }
  }

  async listCoupons(req: Request, res: Response) {
    try {
      const adminId = (req as any).admin?.id;
      if (!adminId) return sendError(res, "Unauthorized", 401);
      const coupons = await couponService.listCoupons();
      return sendSuccess(res, "Coupons fetched", coupons);
    } catch (e: any) { return sendError(res, e.message); }
  }

  async getCoupon(req: Request, res: Response) {
    try {
      const adminId = (req as any).admin?.id;
      if (!adminId) return sendError(res, "Unauthorized", 401);
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const coupon = await couponService.getCouponById(id);
      if (!coupon) return sendError(res, "Coupon not found", 404);
      return sendSuccess(res, "Coupon fetched", coupon);
    } catch (e: any) { return sendError(res, e.message); }
  }

  async updateCoupon(req: Request, res: Response) {
    try {
      const adminId = (req as any).admin?.id;
      if (!adminId) return sendError(res, "Unauthorized", 401);
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const updated = await couponService.updateCoupon(id, req.body, adminId);
      return sendSuccess(res, "Coupon updated", updated);
    } catch (e: any) { return sendError(res, e.message); }
  }

  async toggleStatus(req: Request, res: Response) {
    try {
      const adminId = (req as any).admin?.id;
      if (!adminId) return sendError(res, "Unauthorized", 401);
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      const updated = await couponService.toggleCouponStatus(id, adminId);
      return sendSuccess(res, "Coupon status toggled", updated);
    } catch (e: any) { return sendError(res, e.message); }
  }

  async deleteCoupon(req: Request, res: Response) {
    try {
      const adminId = (req as any).admin?.id;
      if (!adminId) return sendError(res, "Unauthorized", 401);
      const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
      await couponService.deleteCoupon(id, adminId);
      return sendSuccess(res, "Coupon deleted");
    } catch (e: any) { return sendError(res, e.message, 400); }
  }

  /** Public endpoint - validate coupon for current user or guest cart */
  async validateCoupon(req: AuthRequest, res: Response) {
    try {
      const userId = req.auth?.id || "";
      const parsed = validateCouponSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, parsed.error.errors.map(e => e.message).join(", "), 400);
      const result = await couponService.validateCoupon(parsed.data.code, userId, parsed.data.itemTotal);
      if (!result.valid) return res.status(422).json({ success: false, message: (result as any).reason });
      return sendSuccess(res, "Coupon is valid", result);
    } catch (e: any) { return sendError(res, e.message); }
  }
}

export const couponController = new CouponController();

/**
 * CouponService - Authoritative server-side coupon validation and application.
 * SECURITY: Frontend totals are NEVER trusted. All discount calculations happen here.
 */
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { CouponType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export interface CouponValidationResult {
  valid: true;
  couponId: string;
  code: string;
  type: CouponType;
  discountAmount: number;
  isFreeShipping: boolean;
}

export interface CouponValidationError {
  valid: false;
  reason: string;
}

export type CouponValidationOutcome = CouponValidationResult | CouponValidationError;

function calculateDiscountAmount(
  type: CouponType,
  value: number,
  maxDiscount: number | null,
  itemTotal: number,
): number {
  switch (type) {
    case CouponType.PERCENTAGE: {
      const raw = Math.round((itemTotal * value) / 100);
      return maxDiscount !== null ? Math.min(raw, maxDiscount) : raw;
    }
    case CouponType.FIXED_AMOUNT:
      return Math.min(value, itemTotal);
    case CouponType.FREE_SHIPPING:
      return 0;
  }
}

export class CouponService {
  async validateCoupon(
    code: string,
    userId: string,
    itemTotal: number,
  ): Promise<CouponValidationOutcome> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { valid: false, reason: "Coupon code is required" };

    const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (!coupon) return { valid: false, reason: "Invalid coupon code" };
    if (!coupon.isActive) return { valid: false, reason: "This coupon is no longer active" };

    const now = new Date();
    if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, reason: "This coupon has expired" };
    if (coupon.validFrom > now) return { valid: false, reason: "This coupon is not yet valid" };
    if (itemTotal < coupon.minOrderValue) return { valid: false, reason: `Minimum order value of Rs.${Math.ceil(coupon.minOrderValue)} required` };
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return { valid: false, reason: "This coupon has reached its usage limit" };

    if (coupon.perCustomerLimit !== null && userId) {
      const userUsageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
      if (userUsageCount >= coupon.perCustomerLimit) return { valid: false, reason: `You have already used this coupon the maximum number of times (${coupon.perCustomerLimit})` };
    }

    const discountAmount = calculateDiscountAmount(coupon.type, coupon.value, coupon.maxDiscount ?? null, itemTotal);

    logger.info("[CouponService] Valid: " + cleanCode + " -> Rs." + discountAmount + " off", { userId, couponId: coupon.id, type: coupon.type });

    return { valid: true, couponId: coupon.id, code: coupon.code, type: coupon.type, discountAmount, isFreeShipping: coupon.type === CouponType.FREE_SHIPPING };
  }

  async applyCouponInTransaction(
    tx: any,
    couponId: string,
    couponCode: string,
    orderId: string,
    userId: string,
    discountAmt: number,
  ): Promise<void> {
    const [locked] = await tx.$queryRaw`SELECT id, "usedCount" as used_count, "usageLimit" as usage_limit FROM "Coupon" WHERE id = ${couponId} FOR UPDATE`;

    if (!locked) throw new Error("[CouponService] Coupon " + couponId + " not found during transaction");
    if (locked.usage_limit !== null && locked.used_count >= locked.usage_limit) throw new Error("[CouponService] Coupon " + couponCode + " exceeded usage limit during concurrent order");

    await tx.$executeRaw`UPDATE "Coupon" SET "usedCount" = "usedCount" + 1, "updatedAt" = NOW() WHERE id = ${couponId}`;

    await tx.couponUsage.create({ data: { id: uuidv4(), couponId, couponCode, orderId, userId, discountAmt } });
    await tx.couponAuditLog.create({ data: { id: uuidv4(), couponId, couponCode, event: "APPLIED", actorId: userId, actorType: "USER", orderId, userId, metadata: { discountAmt } } });
  }

  async createCoupon(data: { code: string; type: CouponType; value: number; maxDiscount?: number; minOrderValue?: number; usageLimit?: number; perCustomerLimit?: number; isActive?: boolean; validFrom?: Date; expiresAt?: Date; description?: string }, adminId: string) {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new Error("Coupon code \"" + code + "\" already exists");

    const coupon = await prisma.coupon.create({
      data: { code, type: data.type, value: data.value, maxDiscount: data.maxDiscount ?? null, minOrderValue: data.minOrderValue ?? 0, usageLimit: data.usageLimit ?? null, perCustomerLimit: data.perCustomerLimit ?? null, isActive: data.isActive ?? true, validFrom: data.validFrom ?? new Date(), expiresAt: data.expiresAt ?? null, description: data.description ?? null, createdByAdminId: adminId },
    });

    await prisma.couponAuditLog.create({ data: { id: uuidv4(), couponId: coupon.id, couponCode: coupon.code, event: "CREATED", actorId: adminId, actorType: "ADMIN", metadata: { type: coupon.type, value: coupon.value } } });
    logger.info("[CouponService] Coupon created: " + code, { adminId, couponId: coupon.id });
    return coupon;
  }

  async listCoupons(filters?: { isActive?: boolean; type?: CouponType }) {
    return prisma.coupon.findMany({ where: filters, orderBy: { createdAt: "desc" }, include: { _count: { select: { usages: true } } } });
  }

  async getCouponById(couponId: string) {
    return prisma.coupon.findUnique({ where: { id: couponId }, include: { _count: { select: { usages: true } } } });
  }

  async updateCoupon(couponId: string, data: Partial<{ isActive: boolean; expiresAt: Date; usageLimit: number; description: string; maxDiscount: number; minOrderValue: number; perCustomerLimit: number }>, adminId: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new Error("Coupon not found");
    const updated = await prisma.coupon.update({ where: { id: couponId }, data });
    await prisma.couponAuditLog.create({ data: { id: uuidv4(), couponId: coupon.id, couponCode: coupon.code, event: "UPDATED", actorId: adminId, actorType: "ADMIN", metadata: data as any } });
    return updated;
  }

  async toggleCouponStatus(couponId: string, adminId: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new Error("Coupon not found");
    const updated = await prisma.coupon.update({ where: { id: couponId }, data: { isActive: !coupon.isActive } });
    await prisma.couponAuditLog.create({ data: { id: uuidv4(), couponId: coupon.id, couponCode: coupon.code, event: updated.isActive ? "ACTIVATED" : "DEACTIVATED", actorId: adminId, actorType: "ADMIN" } });
    return updated;
  }

  async deleteCoupon(couponId: string, adminId: string) {
    const usageCount = await prisma.couponUsage.count({ where: { couponId } });
    if (usageCount > 0) throw new Error("Cannot delete coupon: " + usageCount + " order(s) have redeemed it. Deactivate it instead.");
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new Error("Coupon not found");
    await prisma.couponAuditLog.deleteMany({ where: { couponId } });
    await prisma.couponUsage.deleteMany({ where: { couponId } });
    await prisma.coupon.delete({ where: { id: couponId } });
    logger.info("[CouponService] Coupon deleted: " + coupon.code, { adminId });
  }
}

export const couponService = new CouponService();

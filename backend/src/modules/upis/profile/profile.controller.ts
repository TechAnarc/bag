import { Request, Response, NextFunction } from "express";
import { profileService } from "./profile.service";
import { activityService } from "../activity/activity.service";
import { loyaltyService } from "../loyalty/loyalty.service";
import { securityService } from "../security/security.service";
import { deviceService } from "../device/device.service";

/**
 * Profile Controller
 * User-facing endpoints for digital identity management.
 */
export class ProfileController {
	/**
	 * GET /api/v1/profile/me
	 * Comprehensive 'Me' view with relations
	 */
	async getMe(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = (req as any).auth?.id;
			if (!userId) throw new Error("Unauthorized");

			const profile = await profileService.getMe(userId);

			res.json({
				success: true,
				data: profile,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PUT /api/v1/profile/me
	 */
	async updateMe(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = (req as any).auth?.id;
			const data = req.body;

			const profile = await profileService.updateProfile(userId!, data);

			res.json({
				success: true,
				message: "Profile updated successfully",
				data: profile,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/v1/profile/activity
	 */
	async getMyActivity(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = (req as any).auth?.id;
			const { page } = req.query;

			const activity = await activityService.getMyActivity(
				userId!,
				Number(page) || 1,
			);

			res.json({
				success: true,
				data: activity,
			});
		} catch (error) {
			next(error);
		}
	}
}

export const profileController = new ProfileController();

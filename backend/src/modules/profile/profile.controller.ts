import { Response } from "express";
import { ProfileService } from "./profile.service";
import { sendSuccess, sendError } from "../../utils/response";
import { logger } from "../../config/logger";
import { AuthRequest } from "../../middleware/auth.middleware";

export class ProfileController {
	private profileService: ProfileService;

	constructor() {
		this.profileService = new ProfileService();
	}

	/**
	 * Get current user profile with full hub data
	 */
	getProfile = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "User not authenticated", 401);
			}

			const profile = await this.profileService.getProfile(userId);
			return sendSuccess(res, "Profile retrieved successfully", profile);
		} catch (error: any) {
			logger.error(`Get profile error: ${error.message}`);
			return sendError(res, error.message, 500);
		}
	};

	/**
	 * Update user profile
	 */
	updateProfile = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "User not authenticated", 401);
			}

			const updatedProfile = await this.profileService.updateProfile(
				userId,
				req.body,
			);
			return sendSuccess(res, "Profile updated successfully", updatedProfile);
		} catch (error: any) {
			logger.error(`Update profile error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	/**
	 * Address Management
	 */
	addAddress = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			if (!userId) return sendError(res, "User not authenticated", 401);

			const address = await this.profileService.addAddress(userId, req.body);
			return sendSuccess(res, "Address added successfully", address, 201);
		} catch (error: any) {
			return sendError(res, error.message, 400);
		}
	};

	updateAddress = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			const { addressId } = req.params;
			if (!userId) return sendError(res, "User not authenticated", 401);

			const address = await this.profileService.updateAddress(
				addressId as string,
				userId,
				req.body,
			);
			return sendSuccess(res, "Address updated successfully", address);
		} catch (error: any) {
			return sendError(res, error.message, 400);
		}
	};

	deleteAddress = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			const { addressId } = req.params;
			if (!userId) return sendError(res, "User not authenticated", 401);

			await this.profileService.deleteAddress(addressId as string, userId);
			return sendSuccess(res, "Address deleted successfully");
		} catch (error: any) {
			return sendError(res, error.message, 400);
		}
	};

	/**
	 * Security & 2FA
	 */
	updateSecurity = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			if (!userId) return sendError(res, "User not authenticated", 401);

			const security = await this.profileService.updateSecuritySettings(
				userId,
				req.body,
			);
			return sendSuccess(res, "Security settings updated", security);
		} catch (error: any) {
			return sendError(res, error.message, 400);
		}
	};

	/**
	 * Change user password
	 */
	changePassword = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "User not authenticated", 401);
			}

			await this.profileService.changePassword(userId, req.body);
			return sendSuccess(res, "Password changed successfully");
		} catch (error: any) {
			logger.error(`Change password error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	/**
	 * Delete user account
	 */
	deleteAccount = async (req: AuthRequest, res: Response) => {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "User not authenticated", 401);
			}

			await this.profileService.deleteAccount(userId, req.body.reason);
			return sendSuccess(res, "Account deleted successfully");
		} catch (error: any) {
			logger.error(`Delete account error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};
}

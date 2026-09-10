import { profileRepository } from "./profile.repository";
import { upisEventBus, UPIS_EVENTS } from "../events/event-bus";
import { AccountStatus, VerificationLevel, LoyaltyTier } from "../types";
import { logger } from "../../../config/logger";

/**
 * Profile Service
 * The brain for managing user digital identities.
 */
export class ProfileService {
	constructor() {
		this.initializeEventListeners();
	}

	private initializeEventListeners() {
		/**
		 * Auto-create Profile on User Registration
		 */
		upisEventBus.on(
			UPIS_EVENTS.USER_REGISTERED,
			async (userData: {
				id: string;
				email: string;
				name: string;
				phone?: string;
			}) => {
				try {
					await this.createProfile({
						userId: userData.id,
						fullName: userData.name,
						email: userData.email,
						phone: userData.phone || "N/A", // Schema requires phone
						accountStatus: AccountStatus.ACTIVE,
						verificationLevel: VerificationLevel.BASIC,
						loyaltyTier: LoyaltyTier.BRONZE,
						preferences: {
							notifications: { email: true, push: true, sms: false },
							shopping: { currency: "INR", language: "en" },
						},
					});
					logger.info(
						`[UPIS-PROFILE]: Auto-created profile for user ${userData.id}`,
					);
				} catch (error) {
					logger.error(
						`[UPIS-PROFILE]: Failed to auto-create profile for ${userData.id}:`,
						error,
					);
				}
			},
		);
	}

	/**
	 * Create new profile manually or via auto-event
	 */
	async createProfile(data: any) {
		return profileRepository.create(data);
	}

	/**
	 * Update profile intelligence
	 */
	async updateProfile(userId: string, data: any) {
		const profile = await profileRepository.update(userId, data);
		upisEventBus.emitEvent(UPIS_EVENTS.PROFILE_UPDATED, {
			userId,
			changes: data,
		});
		return profile;
	}

	/**
	 * Get my profile (User Side)
	 */
	async getMe(userId: string) {
		const profile = await profileRepository.findByUserId(userId);
		if (!profile) throw new Error("Profile not found");
		return profile;
	}

	/**
	 * Add new address to profile
	 */
	async addAddress(userId: string, addressData: any) {
		const profile = await this.getMe(userId);
		return profileRepository.addAddress(profile.id, addressData);
	}

	/**
	 * Update Metadata (Analytics/AI)
	 */
	async updateMetadata(userId: string, metadata: any) {
		const profile = await this.getMe(userId);
		const existingMetadata = (profile.metadata as any) || {};

		return profileRepository.update(userId, {
			metadata: {
				...existingMetadata,
				...metadata,
				updatedAt: new Date(),
			},
		});
	}
}

export const profileService = new ProfileService();

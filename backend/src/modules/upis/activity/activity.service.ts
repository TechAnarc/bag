import { activityRepository } from "./activity.repository";
import { profileRepository } from "../profile/profile.repository";
import { upisEventBus, UPIS_EVENTS } from "../events/event-bus";
import { ActivityType, EntityType } from "../types";
import { logger } from "../../../config/logger";

/**
 * Activity Service
 * The primary ingestion point for user behavior signals.
 */
export class ActivityService {
	/**
	 * Track User Activity
	 * Core logic for captures, updates, and events.
	 */
	async trackActivity(input: {
		userId: string;
		type: ActivityType;
		entityType?: EntityType;
		entityId?: string;
		metadata?: any;
		context?: {
			ip?: string;
			userAgent?: string;
			device?: string;
		};
	}) {
		try {
			// 1. Resolve Profile
			const profile = await profileRepository.findByUserId(input.userId);
			if (!profile) {
				logger.warn(
					`[UPIS-ACTIVITY]: No profile found for user ${input.userId}. Skipping log.`,
				);
				return;
			}

			// 2. Insert Activity Log
			const activity = await activityRepository.log({
				profile: { connect: { id: profile.id } },
				type: input.type,
				entityType: input.entityType,
				entityId: input.entityId,
				metadata: input.metadata || {},
				ip: input.context?.ip,
				userAgent: input.context?.userAgent,
				device: input.context?.device,
				createdAt: new Date(),
			} as any);

			// 3. Update Profile 'Last Active' (Sync for real-time reactivity)
			await profileRepository.update(input.userId, {
				lastActiveAt: new Date(),
			});

			// 4. Publish Event (Async behavior for scoring and external systems)
			upisEventBus.emitEvent(UPIS_EVENTS.USER_ACTIVITY_RECORDED, {
				profileId: profile.id,
				userId: input.userId,
				activity,
			});

			return activity;
		} catch (error) {
			logger.error(
				`[UPIS-ACTIVITY]: Error tracking activity for ${input.userId}:`,
				error,
			);
		}
	}

	/**
	 * Get User Activity Summary (Mobile/Web Side)
	 */
	async getMyActivity(userId: string, page = 1) {
		const profile = await profileRepository.findByUserId(userId);
		if (!profile) throw new Error("Profile not found");

		return activityRepository.findByProfileId(profile.id, (page - 1) * 20, 20);
	}
}

export const activityService = new ActivityService();

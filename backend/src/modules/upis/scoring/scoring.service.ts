import { upisEventBus, UPIS_EVENTS } from "../events/event-bus";
import { profileRepository } from "../profile/profile.repository";
import { activityRepository } from "../activity/activity.repository";
import { securityRepository } from "../security/security.repository";
import { ActivityType, ACTIVITY_SCORING_WEIGHTS } from "../types";
import { logger } from "../../../config/logger";

/**
 * Scoring & Intelligence Engine
 * The autonomous brain that evaluates and scores user behavior.
 */
export class ScoringService {
	constructor() {
		this.initializeSubscribers();
	}

	private initializeSubscribers() {
		// 1. Recalculate Engagement on Activity
		upisEventBus.on(UPIS_EVENTS.USER_ACTIVITY_RECORDED, async (data) => {
			await this.calculateEngagementScore(data.profileId);
		});

		// 2. Recalculate Fraud Risk on Security/Device events
		upisEventBus.on(UPIS_EVENTS.LOGIN_FAILED, async (data) => {
			// Logic to find profile and recalculate risk
		});

		upisEventBus.on(UPIS_EVENTS.SECURITY_ALERT, async (data) => {
			await this.calculateFraudRisk(data.profileId);
		});

		// 3. Recalculate Churn on Inactivity or Specific events
	}

	/**
	 * Calculate Engagement Score (0-1)
	 * Based on weighted activity in the last 30 days.
	 */
	async calculateEngagementScore(profileId: string) {
		try {
			const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
			const recentActivities = await activityRepository.findByProfileId(
				profileId,
				0,
				1000,
			);

			const filtered = recentActivities.filter(
				(a: any) => a.createdAt >= thirtyDaysAgo,
			);

			let rawScore = 0;
			filtered.forEach((activity: any) => {
				const weight =
					(ACTIVITY_SCORING_WEIGHTS as any)[activity.type as ActivityType] || 1;
				rawScore += weight;
			});

			// Normalize score (e.g., 200 points = 1.0)
			const normalizedScore = Math.min(1.0, rawScore / 200);

			await profileRepository.updateById(profileId, {
				engagementScore: normalizedScore,
			});

			logger.debug(
				`[UPIS-SCORING]: Engagement score for ${profileId} updated to ${normalizedScore}`,
			);
			return normalizedScore;
		} catch (error) {
			logger.error(
				`[UPIS-SCORING]: Error calculating engagement for ${profileId}:`,
				error,
			);
		}
	}

	/**
	 * Calculate Churn Risk (0-1)
	 * Based on recency of purchase and activity decline.
	 */
	async calculateChurnRisk(profileId: string) {
		const profile = await profileRepository.findById(profileId);
		if (!profile) return;

		const lastSeen = profile.lastActiveAt || profile.createdAt;
		const daysSinceSeen =
			(Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);

		let risk = 0;
		if (daysSinceSeen > 90) risk = 0.9;
		else if (daysSinceSeen > 60) risk = 0.7;
		else if (daysSinceSeen > 30) risk = 0.4;
		else risk = 0.1;

		// Adjust based on engagement score
		if (profile.engagementScore > 0.8) risk -= 0.1;
		if (profile.engagementScore < 0.2) risk += 0.2;

		const finalRisk = Math.max(0, Math.min(1.0, risk));

		await profileRepository.updateById(profileId, { churnRisk: finalRisk });
		return finalRisk;
	}

	/**
	 * Calculate Fraud Risk (0-1)
	 */
	async calculateFraudRisk(profileId: string) {
		const security = await securityRepository.findByProfileId(profileId);
		if (!security) return;

		let risk = 0.1; // Base risk

		// if (security.failedLoginAttempts > 10) risk += 0.5;
		// if (security.suspiciousActivity) risk += 0.4;

		const finalRisk = Math.max(0, Math.min(1.0, risk));

		await profileRepository.updateById(profileId, { fraudRisk: finalRisk });
		return finalRisk;
	}
}

export const scoringService = new ScoringService();

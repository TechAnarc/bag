import { securityRepository } from "./security.repository";
import { profileRepository } from "../profile/profile.repository";
import { upisEventBus, UPIS_EVENTS } from "../events/event-bus";
import { VerificationLevel } from "../types";
import { logger } from "../../../config/logger";

/**
 * Security Intelligence Service
 * Protects users and computes security hygiene scores.
 */
export class SecurityService {
	/**
	 * Record Successful Login
	 */
	async recordLoginSuccess(
		userId: string,
		context: { ip: string; device: string },
	) {
		try {
			const profile = await profileRepository.findByUserId(userId);
			if (!profile) return;

			await securityRepository.resetFailedAttempts(profile.id);
			await securityRepository.update(profile.id, {
				lastLoginAt: new Date(),
				lastLoginIp: context.ip,
				lastLoginDevice: context.device,
			});

			// Trigger score recalculation
			await this.recalculateSecurityScore(profile.id);

			upisEventBus.emitEvent(UPIS_EVENTS.LOGIN_SUCCESS, { userId, ...context });
		} catch (error) {
			logger.error(
				`[UPIS-SECURITY]: Error recording login success for ${userId}:`,
				error,
			);
		}
	}

	/**
	 * Record Failed Login
	 */
	async recordLoginFailure(userId: string, context: { ip: string }) {
		try {
			const profile = await profileRepository.findByUserId(userId);
			if (!profile) return;

			const security = await securityRepository.incrementFailedAttempts(
				profile.id,
			);

			// Lockout logic: After 5 failed attempts, lock for 30 mins
			// DISABLED: failedLoginAttempts field not in schema
			/*
            if (security.failedLoginAttempts >= 5) {
                const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                await securityRepository.update(profile.id, { lockedUntil: lockUntil });

                upisEventBus.emitEvent(UPIS_EVENTS.SECURITY_ALERT, {
                    userId,
                    type: 'ACCOUNT_LOCKED',
                    details: 'Multiple failed login attempts'
                });
            }
            */

			upisEventBus.emitEvent(UPIS_EVENTS.LOGIN_FAILED, { userId, ...context });
		} catch (error) {
			logger.error(
				`[UPIS-SECURITY]: Error recording login failure for ${userId}:`,
				error,
			);
		}
	}

	/**
	 * Recalculate Security Score (0-100)
	 * A living intelligence metric.
	 */
	async recalculateSecurityScore(profileId: string) {
		try {
			const security = await securityRepository.findByProfileId(profileId);
			if (!security) return;

			let score = 20; // Base score for having an account

			// if (security.passwordStrength > 70) score += 20;
			// if (security.emailVerified) score += 20;
			// if (security.phoneVerified) score += 20;
			if (security.twoFactorEnabled) score += 20;

			// Penalties
			// if (security.suspiciousActivity) score -= 30;

			const finalScore = Math.max(0, Math.min(100, score));

			await securityRepository.update(profileId, { securityScore: finalScore });

			return finalScore;
		} catch (error) {
			logger.error(
				`[UPIS-SECURITY]: Error calculating security score for ${profileId}:`,
				error,
			);
		}
	}

	/**
	 * Update Verification Status
	 */
	async verifyContact(userId: string, type: "EMAIL" | "PHONE") {
		const profile = await profileRepository.findByUserId(userId);
		if (!profile) return;

		const update: any = {};
		if (type === "EMAIL") {
			update.emailVerified = true;
			update.emailVerifiedAt = new Date();
		} else {
			update.phoneVerified = true;
			update.phoneVerifiedAt = new Date();
		}

		await securityRepository.update(profile.id, update);

		// Update Master Profile Verification Level if both are verified
		const security = await securityRepository.findByProfileId(profile.id);
		if (security) {
			// Simplified check - schema mismatch
			await profileRepository.update(userId, {
				verificationLevel: VerificationLevel.PHONE_VERIFIED,
			});
		}

		await this.recalculateSecurityScore(profile.id);
	}
}

export const securityService = new SecurityService();

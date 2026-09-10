import { loyaltyRepository } from "./loyalty.repository";
import { profileRepository } from "../profile/profile.repository";
import { upisEventBus, UPIS_EVENTS } from "../events/event-bus";
import {
	LoyaltyTier,
	LoyaltyTransactionType,
	LoyaltySource,
	getTierBySpend,
} from "../types";
import { logger } from "../../../config/logger";

/**
 * Loyalty Engine Service
 * Handles rewards, tiers, and value-based intelligence.
 */
export class LoyaltyService {
	/**
	 * Earn Points
	 */
	async earnPoints(input: {
		userId: string;
		points: number;
		description: string;
		source: LoyaltySource;
		reference?: string;
	}) {
		try {
			const profile = await profileRepository.findByUserId(input.userId);
			if (!profile) throw new Error("Profile not found");

			const result = await loyaltyRepository.updateBalance({
				profileId: profile.id,
				pointsDelta: input.points,
				type: LoyaltyTransactionType.EARNED,
				description: input.description,
				source: input.source,
				reference: input.reference,
			});

			upisEventBus.emitEvent(UPIS_EVENTS.POINTS_EARNED, {
				userId: input.userId,
				points: input.points,
				newBalance: result.points,
			});

			return result;
		} catch (error) {
			logger.error(
				`[UPIS-LOYALTY]: Error earning points for ${input.userId}:`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Redeem Points
	 */
	async redeemPoints(input: {
		userId: string;
		points: number;
		description: string;
		reference?: string;
	}) {
		try {
			const profile = await profileRepository.findByUserId(input.userId);
			if (!profile) throw new Error("Profile not found");

			const result = await loyaltyRepository.updateBalance({
				profileId: profile.id,
				pointsDelta: -Math.abs(input.points),
				type: LoyaltyTransactionType.REDEEMED,
				description: input.description,
				source: "PURCHASE", // Usually redemption happens at checkout
				reference: input.reference,
			});

			upisEventBus.emitEvent(UPIS_EVENTS.POINTS_REDEEMED, {
				userId: input.userId,
				points: input.points,
				newBalance: result.points,
			});

			return result;
		} catch (error) {
			logger.error(
				`[UPIS-LOYALTY]: Error redeeming points for ${input.userId}:`,
				error,
			);
			throw error;
		}
	}

	/**
	 * Tier Evaluator (Event Subscriber)
	 * Triggered on Order Completion to check for tier upgrades.
	 */
	async evaluateTier(userId: string, totalSpent: number) {
		try {
			const profile = await profileRepository.findByUserId(userId);
			if (!profile) return;

			const currentTier = profile.loyaltyTier as LoyaltyTier;
			const calculatedTier = getTierBySpend(totalSpent);

			if (currentTier !== calculatedTier) {
				// Update both Profile and Loyalty Account
				await profileRepository.update(userId, { loyaltyTier: calculatedTier });
				await loyaltyRepository.updateBalance({
					profileId: profile.id,
					pointsDelta: 0, // No points change, just tier
					type: "ADJUSTED",
					description: `Tier upgraded to ${calculatedTier} based on lifetime spend`,
					source: "ADMIN",
					newTier: calculatedTier,
				});

				upisEventBus.emitEvent(UPIS_EVENTS.TIER_CHANGED, {
					userId,
					oldTier: currentTier,
					newTier: calculatedTier,
				});

				logger.info(
					`[UPIS-LOYALTY]: Tier upgraded for user ${userId} to ${calculatedTier}`,
				);
			}
		} catch (error) {
			logger.error(
				`[UPIS-LOYALTY]: Error evaluating tier for ${userId}:`,
				error,
			);
		}
	}
}

export const loyaltyService = new LoyaltyService();

import { prisma } from "../../../config/database";
import { Prisma } from "@prisma/client";

/**
 * Activity Repository
 * Direct logging of every meaningful user interaction.
 */
export class ActivityRepository {
	/**
	 * Log new activity
	 */
	async log(data: Prisma.ProfileActivityCreateInput) {
		return prisma.profileActivity.create({
			data,
		});
	}

	/**
	 * Get user activity history (paged)
	 */
	async findByProfileId(profileId: string, skip = 0, take = 20) {
		return prisma.profileActivity.findMany({
			where: { profileId },
			orderBy: { createdAt: "desc" },
			skip,
			take,
		});
	}

	/**
	 * Get activity count for a specific period (Scoring support)
	 */
	async getCountInPeriod(profileId: string, startDate: Date) {
		return prisma.profileActivity.count({
			where: {
				profileId,
				createdAt: { gte: startDate },
			},
		});
	}
}

export const activityRepository = new ActivityRepository();

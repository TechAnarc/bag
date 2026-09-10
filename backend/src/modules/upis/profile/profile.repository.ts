import { prisma } from "../../../config/database";
import { Prisma } from "@prisma/client";

/**
 * Profile Repository
 * Handles direct database interactions for UserProfile and related entities.
 */
export class ProfileRepository {
	/**
	 * Create master user profile
	 */
	async create(data: Prisma.UserProfileCreateInput) {
		return prisma.userProfile.create({
			data,
			include: {
				loyaltyAccount: true,
			},
		});
	}

	/**
	 * Find profile by user ID
	 */
	async findByUserId(userId: string) {
		return prisma.userProfile.findUnique({
			where: { userId },
			include: {
				addresses: true,
				loyaltyAccount: true,
				devices: true,
			},
		});
	}

	/**
	 * Find profile by ID
	 */
	async findById(id: string) {
		return prisma.userProfile.findUnique({
			where: { id },
			include: {
				addresses: true,
				loyaltyAccount: true,
				devices: true,
			},
		});
	}

	/**
	 * Update profile data
	 */
	async update(userId: string, data: Prisma.UserProfileUpdateInput) {
		return prisma.userProfile.update({
			where: { userId },
			data,
		});
	}

	/**
	 * Update profile data by master ID
	 */
	async updateById(id: string, data: Prisma.UserProfileUpdateInput) {
		return prisma.userProfile.update({
			where: { id },
			data,
		});
	}

	/**
	 * Manage Addresses
	 */
	async addAddress(
		profileId: string,
		addressData: Prisma.ProfileAddressCreateWithoutProfileInput,
	) {
		// If it's default, unset others first
		if (addressData.isDefault) {
			await prisma.profileAddress.updateMany({
				where: { profileId },
				data: { isDefault: false },
			});
		}

		return prisma.profileAddress.create({
			data: {
				...addressData,
				profile: { connect: { id: profileId } },
			},
		});
	}

	/**
	 * Admin: List users with intelligence aggregation
	 */
	async listUsersIntelligence(
		filters: any,
		pagination: { skip: number; take: number },
	) {
		return prisma.userProfile.findMany({
			where: filters,
			include: {
				loyaltyAccount: true,
				_count: {
					select: {
						activityLogs: true,
						// orders: true - field doesn't exist in schema
					},
				},
			},
			skip: pagination.skip,
			take: pagination.take,
			orderBy: { lifetimeValue: "desc" },
		});
	}
}

export const profileRepository = new ProfileRepository();

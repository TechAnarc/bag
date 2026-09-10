import { prisma } from "../../../config/database";

/**
 * Security Repository
 * Intelligence layer for account protection.
 * STUB: Compatible interface with existing calls
 */
export class SecurityRepository {
	async findByUserId(userId: string) {
		return prisma.userSecurity.findUnique({
			where: { userId },
		});
	}

	// Alias for compatibility
	async findByProfileId(profileId: string) {
		return this.findByUserId(profileId);
	}

	async createRecord(userId: string) {
		return prisma.userSecurity.create({
			data: {
				userId,
			},
		});
	}

	async update(userId: string, data: any) {
		return prisma.userSecurity.update({
			where: { userId },
			data,
		});
	}

	async incrementFailedAttempts(userId: string) {
		// Stub - UserSecurity model doesn't have this field yet
		return this.findByUserId(userId);
	}

	async resetFailedAttempts(userId: string) {
		// Stub - UserSecurity model doesn't have this field yet
		return this.findByUserId(userId);
	}
}

export const securityRepository = new SecurityRepository();

import { prisma } from "../../../config/database";
import { Prisma } from "@prisma/client";

/**
 * Loyalty Repository
 * Atomic operations for points and transactions.
 */
export class LoyaltyRepository {
	/**
	 * Find account by Profile ID
	 */
	async findByProfileId(profileId: string) {
		return prisma.profileLoyalty.findUnique({
			where: { profileId },
			include: {
				transactions: {
					orderBy: { createdAt: "desc" },
					take: 10,
				},
			},
		});
	}

	/**
	 * Update Loyalty Account and Record Transaction (Atomic)
	 */
	async updateBalance(data: {
		profileId: string;
		pointsDelta: number;
		type: string;
		description: string;
		source: string;
		reference?: string;
		newTier?: string;
	}) {
		return prisma.$transaction(async (tx) => {
			// 1. Get current state
			const account = await tx.profileLoyalty.findUnique({
				where: { profileId: data.profileId },
			});

			if (!account) throw new Error("Loyalty account not found");

			const balanceBefore = account.points;
			const balanceAfter = balanceBefore + data.pointsDelta;

			if (balanceAfter < 0) throw new Error("Insufficient points balance");

			// 2. Update Account
			const updatedAccount = await tx.profileLoyalty.update({
				where: { profileId: data.profileId },
				data: {
					points: balanceAfter,
					lifetimePoints:
						data.pointsDelta > 0
							? account.lifetimePoints + data.pointsDelta
							: account.lifetimePoints,
					pointsRedeemed:
						data.pointsDelta < 0
							? account.pointsRedeemed + Math.abs(data.pointsDelta)
							: account.pointsRedeemed,
					...(data.newTier && { tier: data.newTier, tierSince: new Date() }),
					updatedAt: new Date(),
				},
			});

			// 3. Create Transaction Record
			await tx.loyaltyTransaction.create({
				data: {
					loyaltyId: account.id,
					type: data.type,
					points: data.pointsDelta,
					balanceBefore,
					balanceAfter,
					description: data.description,
					source: data.source,
					reference: data.reference,
					createdAt: new Date(),
				},
			});

			return updatedAccount;
		});
	}

	/**
	 * Create Initial Loyalty Account
	 */
	async createAccount(profileId: string) {
		return prisma.profileLoyalty.create({
			data: {
				profileId,
				tier: "BRONZE",
				points: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
	}
}

export const loyaltyRepository = new LoyaltyRepository();

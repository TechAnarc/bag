import { prisma } from "../../config/database";
import bcrypt from "bcryptjs";
import {
	UpdateProfileInput,
	ChangePasswordInput,
	AddressInput,
} from "./profile.schema";

export class ProfileService {
	/**
	 * Get user profile by ID with full intelligence data
	 */
	async getProfile(userId: string) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				profile: {
					include: {
						addresses: true,
						loyaltyAccount: true,
						devices: true,
					},
				},
				security: true,
				addresses: true,
				orders: {
					take: 5,
					orderBy: { createdAt: "desc" },
				},
				wishlist: {
					include: { product: true },
				},
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		return user;
	}

	/**
	 * Update user profile
	 */
	async updateProfile(userId: string, data: UpdateProfileInput) {
		// Update both User and UPIS UserProfile
		return await prisma.$transaction(async (tx) => {
			const updatedUser = await tx.user.update({
				where: { id: userId },
				data: {
					...(data.name && { name: data.name }),
					...(data.phone !== undefined && { phone: data.phone }),
					...(data.avatar !== undefined && { avatar: data.avatar }),
				},
			});

			await tx.userProfile.update({
				where: { userId },
				data: {
					...(data.name && { fullName: data.name }),
					...(data.avatar !== undefined && { profileImage: data.avatar }),
					...(data.phone !== undefined && { phone: data.phone }),
				},
			});

			return updatedUser;
		});
	}

	/**
	 * Address Management
	 */
	async addAddress(userId: string, data: any) {
		if (data.isDefault) {
			await prisma.userAddress.updateMany({
				where: { userId },
				data: { isDefault: false },
			});
		}

		return prisma.userAddress.create({
			data: {
				...data,
				userId,
			},
		});
	}

	async updateAddress(addressId: string, userId: string, data: any) {
		if (data.isDefault) {
			await prisma.userAddress.updateMany({
				where: { userId },
				data: { isDefault: false },
			});
		}

		return prisma.userAddress.update({
			where: { id: addressId, userId },
			data,
		});
	}

	async deleteAddress(addressId: string, userId: string) {
		return prisma.userAddress.delete({
			where: { id: addressId, userId },
		});
	}

	/**
	 * Security Settings
	 */
	async updateSecuritySettings(
		userId: string,
		data: { twoFactorEnabled?: boolean; preferred2FAMethod?: "EMAIL" | "SMS" },
	) {
		return prisma.userSecurity.update({
			where: { userId },
			data,
		});
	}

	/**
	 * Change user password
	 */
	async changePassword(
		userId: string,
		data: ChangePasswordInput,
	): Promise<void> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new Error("User not found");
		}

		const isPasswordValid = await bcrypt.compare(
			data.currentPassword,
			user.passwordHash,
		);

		if (!isPasswordValid) {
			throw new Error("Current password is incorrect");
		}

		const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
		const newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds);

		await prisma.user.update({
			where: { id: userId },
			data: {
				passwordHash: newPasswordHash,
			},
		});

		// Log security event
		await prisma.userSecurity.update({
			where: { userId },
			data: { lastPasswordChangedAt: new Date() },
		});
	}

	/**
	 * Delete user account
	 */
	async deleteAccount(userId: string, deletionReason?: string): Promise<void> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				orders: { select: { total: true } },
			},
		});

		if (!user) throw new Error("User not found");

		const orderCount = user.orders.length;
		const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0);

		await prisma.$transaction(async (tx) => {
			await tx.deletedUser.create({
				data: {
					originalUserId: user.id,
					name: user.name,
					email: user.email || "",
					phone: user.phone,
					passwordHash: user.passwordHash,
					role: user.role,
					avatar: user.avatar,
					accountCreatedAt: user.createdAt,
					deletionReason: deletionReason || "User requested account deletion",
					orderCount: orderCount,
					totalSpent: totalSpent,
				},
			});

			await tx.user.delete({
				where: { id: userId },
			});
		});
	}
}

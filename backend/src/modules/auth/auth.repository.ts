import { prisma } from "../../config/database";
import { Role, User } from "@prisma/client";

export class AuthRepository {
	async findByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { email },
		});
	}

	async findByPhone(phone: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { phone },
		});
	}

	async findById(id: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: {
				id,
			},
			include: {
				profile: true,
				security: true,
			},
		});
	}

	async createUser(data: {
		email?: string;
		phone?: string;
		passwordHash: string;
		name: string;
		role?: Role;
		status?: any; // UserStatus
		avatar?: string | null;
	}): Promise<User> {
		return (prisma.user.create as any)({
			data: {
				email: data.email,
				phone: data.phone,
				passwordHash: data.passwordHash,
				name: data.name,
				avatar: data.avatar,
				role: data.role || Role.USER,
				status: data.status || "UNVERIFIED",
				profile: {
					create: {
						fullName: data.name,
						email: data.email || null,
						phone: data.phone || null,
						profileImage: data.avatar,
					},
				},
				security: {
					create: {
						twoFactorEnabled: false,
					},
				},
			},
		});
	}

	async updateUserStatus(userId: string, status: any) {
		return (prisma.user as any).update({
			where: { id: userId },
			data: { status },
		});
	}

	async updateUser(userId: string, data: any) {
		return (prisma.user as any).update({
			where: { id: userId },
			data,
		});
	}

	async updateLastLogin(userId: string) {
		return prisma.user.update({
			where: { id: userId },
			data: {
				lastLoginAt: new Date(),
				loginCount: { increment: 1 },
			},
		});
	}

	async findDeletedUserByEmail(email: string) {
		return prisma.deletedUser.findFirst({
			where: { email },
		});
	}

	async findDeletedUserById(userId: string) {
		return prisma.deletedUser.findUnique({
			where: { originalUserId: userId },
		});
	}
}

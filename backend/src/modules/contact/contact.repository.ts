import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ContactRepository {
	async createSubmission(data: {
		name: string;
		email: string;
		phone?: string;
		subject?: string;
		message: string;
	}) {
		return prisma.contactSubmission.create({
			data,
		});
	}

	async getAllSubmissions(filters?: {
		isRead?: boolean;
		isReplied?: boolean;
		limit?: number;
		offset?: number;
	}) {
		const where: any = {};
		if (filters?.isRead !== undefined) {
			where.isRead = filters.isRead;
		}
		if (filters?.isReplied !== undefined) {
			where.isReplied = filters.isReplied;
		}

		try {
			return await prisma.contactSubmission.findMany({
				where,
				orderBy: { createdAt: "desc" },
				take: filters?.limit || 50,
				skip: filters?.offset || 0,
			});
		} catch (err: any) {
			// If isReplied column doesn't exist on this deployment, retry without it
			if (err?.message?.includes("isReplied") || err?.code === "P2025" || err?.code === "42703") {
				const safeWhere: any = {};
				if (filters?.isRead !== undefined) safeWhere.isRead = filters.isRead;
				return await prisma.contactSubmission.findMany({
					where: safeWhere,
					orderBy: { createdAt: "desc" },
					take: filters?.limit || 50,
					skip: filters?.offset || 0,
				});
			}
			throw err;
		}
	}

	async markAsRead(id: string) {
		return prisma.contactSubmission.update({
			where: { id },
			data: { isRead: true },
		});
	}

	async saveReply(id: string, replyText: string, repliedBy?: string) {
		try {
			return await prisma.contactSubmission.update({
				where: { id },
				data: {
					isRead: true,
					isReplied: true,
					replyText,
					repliedAt: new Date(),
					repliedBy,
				},
			});
		} catch (err: any) {
			// Fallback if reply columns don't exist on this deployment
			if (err?.message?.includes("isReplied") || err?.message?.includes("replyText") || err?.code === "42703") {
				return await prisma.contactSubmission.update({
					where: { id },
					data: { isRead: true },
				});
			}
			throw err;
		}
	}

	async getSubmissionById(id: string) {
		return prisma.contactSubmission.findUnique({
			where: { id },
		});
	}
}

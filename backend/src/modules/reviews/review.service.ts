import { prisma } from '../../config/database';
import { PrismaClient, ReviewStatus } from "@prisma/client";
import type { CreateReviewDto, UpdateReviewStatusDto } from "./review.types";
import { eventBus, DomainEvent } from "../../core/events/event-bus";



export class ReviewService {
	async create(data: CreateReviewDto, userId?: string) {
		// 5-star reviews are auto-approved
		const status: ReviewStatus = data.rating === 5 ? "APPROVED" : "PENDING";

		const review = await prisma.review.create({
			data: {
				...data,
				rating: data.rating || 0,
				name: data.name || "Anonymous",
				status,
				isVerified: !!userId,
				product: data.productId
					? { connect: { id: data.productId } }
					: undefined,
				user: userId ? { connect: { id: userId } } : undefined,
				productId: undefined,
			} as any,
		});

		eventBus.emitDomainEvent(DomainEvent.REVIEW_SUBMITTED, review);
		return review;
	}

	async getByProduct(productId: string, limit = 10, offset = 0) {
		// Get total count for pagination
		const total = await prisma.review.count({
			where: {
				productId,
				status: "APPROVED",
			},
		});

		const reviews = await prisma.review.findMany({
			where: {
				productId,
				status: "APPROVED",
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
			skip: offset,
			select: {
				id: true,
				name: true,
				rating: true,
				reviewText: true,
				profileImageUrl: true,
				createdAt: true,
				isVerified: true,
			},
		});

		return {
			reviews,
			hasMore: offset + reviews.length < total,
			total,
		};
	}

	async getStats(productId: string) {
		const aggregations = await prisma.review.aggregate({
			_avg: { rating: true },
			_count: { rating: true },
			where: { productId, status: "APPROVED" },
		});

		return {
			averageRating: Number(aggregations._avg.rating?.toFixed(1)) || 0,
			totalReviews: aggregations._count.rating || 0,
		};
	}

	async getAllAdmin() {
		return prisma.review.findMany({
			orderBy: {
				createdAt: "desc",
			},
			include: {
				product: {
					select: {
						name: true,
						images: true,
					},
				},
			},
		});
	}

	async updateStatus(id: string, status: ReviewStatus) {
		return prisma.review.update({
			where: { id },
			data: { status },
		});
	}

	async delete(id: string) {
		return prisma.review.delete({
			where: { id },
		});
	}
}

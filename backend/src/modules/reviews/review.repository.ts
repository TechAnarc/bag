import { prisma } from "../../config/database";
import { CreateReviewInput } from "./review.schema";

export class ReviewRepository {
	/**
	 * Create a new review
	 */
	async create(data: CreateReviewInput & { userId?: string }) {
		return (prisma.review.create as any)({
			data: {
				...data,
				rating: data.rating || 0,
				name: data.displayName || "Anonymous", // Assuming 'name' should come from 'displayName' or default
				isVerified: !!data.userId, // Use data.userId for verification status
				product: data.productId
					? { connect: { id: data.productId } }
					: undefined,
				user: data.userId ? { connect: { id: data.userId } } : undefined,
			},
			include: {
				product: {
					select: {
						id: true,
						name: true,
						slug: true,
					},
				},
			},
		});
	}

	/**
	 * Get reviews for a specific product
	 */
	async getByProductId(
		productId: string,
		options: {
			limit?: number;
			offset?: number;
			sortBy?: "recent" | "helpful" | "rating";
		} = {},
	) {
		const { limit = 10, offset = 0, sortBy = "recent" } = options;

		// Determine sort order
		let orderBy: any = { createdAt: "desc" }; // default: recent
		if (sortBy === "helpful") {
			orderBy = { isHelpful: "desc" };
		} else if (sortBy === "rating") {
			orderBy = { rating: "desc" };
		}

		const [reviews, total] = await Promise.all([
			(prisma.review.findMany as any)({
				where: {
					productId,
					status: "APPROVED",
				},
				orderBy,
				take: limit,
				skip: offset,
				select: {
					id: true,
					rating: true,
					title: true,
					content: true,
					images: true,
					displayName: true,
					isVerified: true,
					isHelpful: true,
					createdAt: true,
				},
			}),
			(prisma.review.count as any)({
				where: {
					productId,
					status: "APPROVED",
				},
			}),
		]);

		return { reviews, total };
	}

	/**
	 * Get review statistics for a product
	 */
	async getProductStats(productId: string) {
		const stats = await (prisma.review.groupBy as any)({
			by: ["rating"],
			where: {
				productId,
				status: "APPROVED",
			},
			_count: {
				rating: true,
			},
		});

		const totalReviews = stats.reduce(
			(sum, stat) => sum + stat._count.rating,
			0,
		);
		const averageRating =
			totalReviews > 0
				? stats.reduce(
						(sum, stat) => sum + stat.rating * stat._count.rating,
						0,
					) / totalReviews
				: 0;

		// Distribution of ratings (1-5)
		const distribution = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		};

		stats.forEach((stat) => {
			distribution[stat.rating as keyof typeof distribution] =
				stat._count.rating;
		});

		return {
			totalReviews,
			averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
			distribution,
		};
	}

	/**
	 * Check if user has already reviewed a product
	 */
	async hasUserReviewed(productId: string, email: string): Promise<boolean> {
		const existing = await prisma.review.findFirst({
			where: {
				productId,
				email,
			},
		});

		return !!existing;
	}
}

import { z } from "zod";

export const createReviewSchema = z.object({
	body: z.object({
		productId: z.string().uuid("Invalid product ID"),
		rating: z
			.number()
			.int()
			.min(1, "Rating must be at least 1")
			.max(5, "Rating must be at most 5"),
		title: z
			.string()
			.min(3, "Title must be at least 3 characters")
			.max(100, "Title must be at most 100 characters"),
		content: z
			.string()
			.min(10, "Review must be at least 10 characters")
			.max(5000, "Review must be at most 5000 characters"),
		images: z.array(z.string().url()).optional().default([]),
		displayName: z
			.string()
			.min(2, "Display name must be at least 2 characters")
			.max(50, "Display name must be at most 50 characters"),
		email: z.string().email("Invalid email address"),
	}),
});

export const getProductReviewsSchema = z.object({
	params: z.object({
		productId: z.string().uuid("Invalid product ID"),
	}),
	query: z.object({
		limit: z.string().optional(),
		offset: z.string().optional(),
		sortBy: z.enum(["recent", "helpful", "rating"]).optional(),
	}),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>["body"];
export type GetProductReviewsQuery = z.infer<
	typeof getProductReviewsSchema
>["query"];

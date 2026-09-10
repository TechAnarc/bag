import { z } from "zod";

export const CreateReviewSchema = z.object({
	productId: z.string().uuid(),
	name: z.string().min(2),
	email: z.string().email().optional(),
	rating: z.number().int().min(1).max(5),
	reviewText: z.string().min(10, "Review must be at least 10 characters"),
	profileImageUrl: z.string().url().optional(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

export const UpdateReviewStatusSchema = z.object({
	status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export type UpdateReviewStatusDto = z.infer<typeof UpdateReviewStatusSchema>;

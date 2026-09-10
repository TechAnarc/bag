import type { Request, Response } from "express";
import { ReviewService } from "./review.service";
import { CreateReviewSchema, UpdateReviewStatusSchema } from "./review.types";

const reviewService = new ReviewService();

export class ReviewController {
	async create(req: Request, res: Response): Promise<void> {
		try {
			// Validate body
			const validated = CreateReviewSchema.safeParse(req.body);

			if (!validated.success) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: validated.error.errors,
				});
				return;
			}

			// Check for user from auth middleware (if present)
			const userId = (req as any).auth?.id;

			const review = await reviewService.create(validated.data, userId);

			res.status(201).json({
				success: true,
				message:
					review.status === "APPROVED"
						? "Review submitted successfully!"
						: "Review submitted and pending approval.",
				data: review,
			});
		} catch (error) {
			console.error("Create review error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to submit review",
			});
		}
	}

	async getProductReviews(req: Request, res: Response): Promise<void> {
		try {
			const productId = req.params.productId as string;
			const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
			const offset = req.query.offset
				? parseInt(req.query.offset as string)
				: 0;

			const result = await reviewService.getByProduct(productId, limit, offset);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Failed to fetch reviews",
			});
		}
	}

	async getReviewStats(req: Request, res: Response): Promise<void> {
		try {
			const productId = req.params.productId as string;
			const stats = await reviewService.getStats(productId);

			res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Failed to fetch review stats",
			});
		}
	}

	async getAllReviews(req: Request, res: Response): Promise<void> {
		try {
			const reviews = await reviewService.getAllAdmin();
			res.status(200).json({
				success: true,
				data: reviews,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Failed to fetch admin reviews",
			});
		}
	}

	async updateStatus(req: Request, res: Response): Promise<void> {
		try {
			const id = req.params.id as string;
			const validated = UpdateReviewStatusSchema.safeParse(req.body);

			if (!validated.success) {
				res.status(400).json({ success: false, message: "Invalid status" });
				return;
			}

			const review = await reviewService.updateStatus(
				id,
				validated.data.status as any,
			);

			res.status(200).json({
				success: true,
				message: "Review status updated",
				data: review,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Failed to update review status",
			});
		}
	}

	async deleteReview(req: Request, res: Response): Promise<void> {
		try {
			const id = req.params.id as string;
			await reviewService.delete(id);

			res.status(200).json({
				success: true,
				message: "Review deleted",
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Failed to delete review",
			});
		}
	}
}

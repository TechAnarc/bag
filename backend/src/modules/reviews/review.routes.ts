import { Router } from "express";
import { ReviewController } from "./review.controller";
import { authenticateAdmin } from "../../middleware/adminAuth.middleware";

const reviewRoutes = Router();
const controller = new ReviewController();

// Public / User Routes
// We allow guest reviews, so no strict auth middleware.
// Controller will handle userId being null.
reviewRoutes.post("/", controller.create);

reviewRoutes.get("/product/:productId/stats", controller.getReviewStats);
reviewRoutes.get("/product/:productId", controller.getProductReviews);

// Admin Routes
reviewRoutes.get("/admin", authenticateAdmin, controller.getAllReviews);
reviewRoutes.patch(
	"/admin/:id/status",
	authenticateAdmin,
	controller.updateStatus,
);
reviewRoutes.delete("/admin/:id", authenticateAdmin, controller.deleteReview);

export default reviewRoutes;

import { Router } from "express";
import { ProductController } from "./product.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { Role } from "@prisma/client";
import { ImageUploadService } from "../../services/image-upload.service";
import { authenticateAdmin } from "../../middleware/adminAuth.middleware";

const router = Router();
const productController = new ProductController();

// Intelligent Product Creation Routes (Define BEFORE generic ID routes)
router.get("/generate-sku", authenticateAdmin, productController.generateSku);
router.post(
	"/generate-tagline",
	authenticateAdmin,
	productController.generateTagline,
);
router.post(
	"/generate-description",
	authenticateAdmin,
	productController.generateDescription,
);
router.post(
	"/upload-images",
	authenticateAdmin,
	ImageUploadService.createUploadMiddleware(),
	productController.uploadImages,
);

// Public routes
router.get("/", productController.getAll);
router.get("/search", productController.search);
router.get("/slug/:slug", productController.getBySlug);
router.get("/:id", productController.getById);
router.get("/:id/related", productController.getRelated);

// Admin-only routes (using Admin table authentication)
router.post("/", authenticateAdmin, productController.create);
router.post("/:id/duplicate", authenticateAdmin, productController.duplicate);
router.patch("/:id/archive", authenticateAdmin, productController.archive);
router.patch("/:id/stock", authenticateAdmin, productController.updateStock);
router.put("/:id", authenticateAdmin, productController.update);
router.delete("/:id", authenticateAdmin, productController.delete);

export default router;

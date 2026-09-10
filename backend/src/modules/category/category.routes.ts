import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);

// Admin-only routes
import { authenticateAdmin } from "../../middleware/adminAuth.middleware";

router.post("/", authenticateAdmin, categoryController.create);
router.put("/:id", authenticateAdmin, categoryController.update);
router.delete("/:id", authenticateAdmin, categoryController.delete);

export default router;

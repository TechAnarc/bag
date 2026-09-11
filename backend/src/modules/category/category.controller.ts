import { Response } from "express";
import { CategoryService } from "./category.service";
import { sendSuccess, sendError } from "../../utils/response";
import { logger } from "../../config/logger";
import { AuthRequest } from "../../middleware/auth.middleware";

import { memoryCache } from "../../utils/cache";

export class CategoryController {
	private categoryService: CategoryService;

	constructor() {
		this.categoryService = new CategoryService();
	}

	getAll = async (req: AuthRequest, res: Response) => {
		try {
			const { gender } = req.query;
			const isAdmin =
				req.auth?.role === "ADMIN" ||
				req.auth?.role === "SUPER_ADMIN" ||
				!!(req as any).admin;

			const cacheKey = `categories:${gender || "all"}:${isAdmin ? "admin" : "public"}`;
			const cached = memoryCache.get(cacheKey);
			if (cached) {
				res.setHeader("X-Cache", "HIT");
				return sendSuccess(res, "Categories retrieved successfully", cached);
			}

			const categories = await this.categoryService.getAllCategories(
				isAdmin,
				gender as string,
			);

			memoryCache.set(cacheKey, categories, 120);
			res.setHeader("X-Cache", "MISS");

			return sendSuccess(res, "Categories retrieved successfully", categories);
		} catch (error: any) {
			logger.error(`[Categories] GET error: ${error.message}`, {
				stack: error.stack,
			});
			return sendError(
				res,
				`Failed to retrieve categories: ${error.message}`,
				500,
			);
		}
	};

	getById = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const category = await this.categoryService.getCategoryById(id as string);
			return sendSuccess(res, "Category retrieved successfully", category);
		} catch (error: any) {
			logger.error(`Get category error: ${error.message}`);
			return sendError(res, error.message, 404);
		}
	};

	create = async (req: AuthRequest, res: Response) => {
		try {
			logger.info(
				`[Categories] POST create - Data: ${JSON.stringify(req.body)}`,
			);

			// Validate required fields
			if (!req.body.name) {
				logger.warn("[Categories] POST failed: Missing name field");
				return sendError(res, "Category name is required", 400);
			}

			const category = await this.categoryService.createCategory(req.body);
			logger.info(`[Categories] Successfully created category: ${category.id}`);
			memoryCache.invalidatePrefix("categories:");
			memoryCache.invalidatePrefix("products:");

			return sendSuccess(res, "Category created successfully", category, 201);
		} catch (error: any) {
			logger.error(`[Categories] POST create error: ${error.message}`, {
				stack: error.stack,
				body: req.body,
			});
			return sendError(res, `Failed to create category: ${error.message}`, 400);
		}
	};

	update = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const category = await this.categoryService.updateCategory(
				id as string,
				req.body,
			);
			memoryCache.invalidatePrefix("categories:");
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Category updated successfully", category);
		} catch (error: any) {
			logger.error(`Update category error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	delete = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			await this.categoryService.deleteCategory(id as string);
			memoryCache.invalidatePrefix("categories:");
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Category deleted successfully", null);
		} catch (error: any) {
			logger.error(`Delete category error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	reorder = async (req: AuthRequest, res: Response) => {
		try {
			const { items } = req.body;
			await this.categoryService.reorderCategories(items);
			memoryCache.invalidatePrefix("categories:");
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Categories reordered successfully", null);
		} catch (error: any) {
			logger.error(`Reorder categories error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	toggleActive = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const category = await this.categoryService.toggleCategoryActive(id as string);
			memoryCache.invalidatePrefix("categories:");
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`, category);
		} catch (error: any) {
			logger.error(`Toggle category active error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};
}

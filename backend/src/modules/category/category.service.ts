import { CategoryRepository } from "./category.repository";
import { Category, Prisma } from "@prisma/client";
import { slugify } from "../../utils/slugify";
import { logger } from "../../config/logger";

export class CategoryService {
	private repository: CategoryRepository;

	constructor() {
		this.repository = new CategoryRepository();
	}

	async getAllCategories(includeInactive = false, gender?: string) {
		try {
			const where: Prisma.CategoryWhereInput = {};
			if (!includeInactive) {
				where.isActive = true;
			}
			if (gender && gender !== "ALL") {
				where.gender = gender;
			}
			logger.debug(`[CategoryService] Finding categories with filter:`, where);
			return await this.repository.findAll(where);
		} catch (error: any) {
			logger.error(`[CategoryService] getAllCategories error:`, error);
			throw new Error(
				`Database error while fetching categories: ${error.message}`,
			);
		}
	}

	async getCategoryById(id: string) {
		const category = await this.repository.findById(id);
		if (!category) {
			throw new Error("Category not found");
		}
		return category;
	}

	async getCategoryBySlug(slug: string) {
		const category = await this.repository.findBySlug(slug);
		if (!category) {
			throw new Error("Category not found");
		}
		return category;
	}

	async createCategory(data: any) {
		if (
			!data.name ||
			typeof data.name !== "string" ||
			data.name.trim().length === 0
		) {
			throw new Error("Category name is required");
		}

		try {
			const slug = data.slug ? slugify(data.slug) : slugify(data.name);

			// Check if already exists
			const existing = await this.repository.findBySlug(slug);
			if (existing) {
				throw new Error("A category with this name or slug already exists");
			}

			const category = await this.repository.create({
				...data,
				slug,
			});

			logger.info(
				`[CategoryService] Successfully created category: ${category.id}`,
			);
			return category;
		} catch (error: any) {
			logger.error(`[CategoryService] createCategory error:`, error);
			throw error;
		}
	}

	async updateCategory(id: string, data: any) {
		const updateData: any = { ...data };

		if (data.name) {
			updateData.slug = slugify(data.name);

			// Check if new slug conflicts with another category
			const existing = await this.repository.findBySlug(updateData.slug);
			if (existing && existing.id !== id) {
				throw new Error("Another category with this name already exists");
			}
		}

		return this.repository.update(id, updateData);
	}

	async deleteCategory(id: string) {
		const productCount = await this.repository.countProducts(id);
		if (productCount > 0) {
			// Find or create fallback "Uncategorized" category
			let fallbackCategory = await this.repository.findBySlug("uncategorized");
			if (!fallbackCategory) {
				fallbackCategory = await this.repository.create({
					name: "Uncategorized",
					slug: "uncategorized",
					isActive: false, // hidden from user facing menus by default
				});
			}

			if (fallbackCategory.id === id) {
				throw new Error("Cannot delete the default Uncategorized category.");
			}

			// Dynamically import prisma to update products to fallback category
			const { prisma } = await import("../../config/database");
			await prisma.product.updateMany({
				where: { categoryId: id },
				data: { categoryId: fallbackCategory.id },
			});
			logger.info(
				`[CategoryService] Reassigned ${productCount} products to fallback category 'Uncategorized'`,
			);
		}

		return this.repository.delete(id);
	}

	async reorderCategories(items: { id: string; sortOrder: number }[]) {
		if (!Array.isArray(items) || items.length === 0) {
			throw new Error("Invalid reorder items array");
		}
		await this.repository.reorder(items);
		return { success: true };
	}

	async toggleCategoryActive(id: string) {
		const category = await this.repository.findById(id);
		if (!category) {
			throw new Error("Category not found");
		}
		return this.repository.update(id, { isActive: !category.isActive });
	}
}

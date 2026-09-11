import { Response } from "express";
import { ProductService } from "./product.service";
import { sendSuccess, sendError } from "../../utils/response";
import { logger } from "../../config/logger";
import { AuthRequest } from "../../middleware/auth.middleware";

import {
	createProductSchema,
	updateProductSchema,
} from "../admin/admin.validation";
import { slugify } from "../../utils/slugify";
import { ImageUploadService } from "../../services/image-upload.service";
import { SkuGeneratorService } from "../../services/sku-generator.service";
import { TaglineGeneratorService } from "../../services/tagline-generator.service";
import { DescriptionGeneratorService } from "../../services/description-generator.service";
import { memoryCache } from "../../utils/cache";

export class ProductController {
	private productService: ProductService;

	constructor() {
		this.productService = new ProductService();
	}

	getAll = async (req: AuthRequest, res: Response) => {
		try {
			const isAdmin =
				req.auth?.role === "ADMIN" ||
				req.auth?.role === "SUPER_ADMIN" ||
				!!(req as any).admin;

			// Canonical SEO Enforcement for Category Query Parameter
			if (
				req.query.category &&
				typeof req.query.category === "string" &&
				!isAdmin
			) {
				const rawCategory = req.query.category;
				const canonicalCategory = slugify(rawCategory);
				if (rawCategory !== canonicalCategory) {
					logger.info(
						`🔄 [SEO] Redirecting product list query from category '${rawCategory}' to '${canonicalCategory}'`,
					);

					// Reconstruct URL with canonical query
					const queryParams = { ...req.query, category: canonicalCategory };
					const queryString = new URLSearchParams(
						queryParams as any,
					).toString();
					return res.redirect(301, `/api/v1/products?${queryString}`);
				}
			}

			if (!isAdmin && !req.query.search) {
				const cacheKey = `products:${req.query.category || "all"}:${req.query.gender || "all"}:${req.query.limit || 20}:${req.query.offset || 0}`;
				const cached = memoryCache.get(cacheKey);
				if (cached) {
					res.setHeader("X-Cache", "HIT");
					return sendSuccess(res, "Products retrieved successfully", cached);
				}
				const result = await this.productService.getAllProducts({
					...req.query,
					isAdmin,
				});
				memoryCache.set(cacheKey, result, 30);
				res.setHeader("X-Cache", "MISS");
				return sendSuccess(res, "Products retrieved successfully", result);
			}

			const result = await this.productService.getAllProducts({
				...req.query,
				isAdmin,
			});
			return sendSuccess(res, "Products retrieved successfully", result);
		} catch (error: any) {
			logger.error(`Get products error: ${error.message}`);
			return sendError(res, error.message);
		}
	};

	getById = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			logger.info(`🔍 [API] Fetching full product data for ID: ${id}`);

			const product = await this.productService.getProductById(id as string);

			if (!product) {
				logger.warn(`⚠️ [API] Product not found for ID: ${id}`);
				return sendError(res, "Product not found", 404);
			}

			// Detailed payload integrity check
			const fields = [
				"name",
				"categoryId",
				"shortTagline",
				"description",
				"sku",
				"images",
				"price",
				"basePrice",
				"sellingPrice",
				"specifications",
				"inventory",
			];
			const missingFields = fields.filter((f) => !(product as any)[f]);

			if (missingFields.length > 0) {
				logger.warn(
					`⚠️ [API] Product ${id} is missing fields: ${missingFields.join(", ")}`,
				);
			}

			logger.info(
				`✅ [API] Returning product payload for ${product.name} (${product.sku}) - Images count: ${product.images?.length || 0}`,
			);

			return sendSuccess(res, "Product retrieved successfully", product);
		} catch (error: any) {
			logger.error(`❌ [API] Get product error: ${error.message}`);
			return sendError(res, error.message, 404);
		}
	};

	getBySlug = async (req: AuthRequest, res: Response) => {
		try {
			const { slug } = req.params;
			if (!slug) return sendError(res, "Slug required", 400);

			const canonicalSlug = slugify(slug as string);
			if (slug !== canonicalSlug) {
				logger.info(
					`🔄 [SEO] Redirecting malformed slug API request from '${slug}' to canonical '${canonicalSlug}'`,
				);
				// For backend APIs, redirect to the normalized API endpoint
				return res.redirect(301, `/api/v1/products/slug/${canonicalSlug}`);
			}

			const product = await this.productService.getProductBySlug(
				slug as string,
			);
			return sendSuccess(res, "Product retrieved successfully", product);
		} catch (error: any) {
			logger.error(`Get product by slug error: ${error.message}`);
			return sendError(res, error.message, 404);
		}
	};

	create = async (req: AuthRequest, res: Response) => {
		try {
			// Input conversion for number strings if they come from multipart/form-data (though currently JSON)
			if (typeof req.body.price === "string")
				req.body.price = parseFloat(req.body.price);

			const validation = createProductSchema.safeParse(req.body);
			if (!validation.success) {
				return sendError(
					res,
					"Validation failed",
					400,
					validation.error.errors,
				);
			}

			const product = await this.productService.createProduct(validation.data);
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Product created successfully", product, 201);
		} catch (error: any) {
			logger.error(`Create product error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	update = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			if (typeof req.body.price === "string")
				req.body.price = parseFloat(req.body.price);

			const validation = updateProductSchema.safeParse(req.body);
			if (!validation.success) {
				return sendError(
					res,
					"Validation failed",
					400,
					validation.error.errors,
				);
			}

			const product = await this.productService.updateProduct(
				id as string,
				validation.data,
			);
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Product updated successfully", product);
		} catch (error: any) {
			logger.error(`Update product error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	delete = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			await this.productService.deleteProduct(id as string);
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Product deleted successfully", null);
		} catch (error: any) {
			logger.error(`Delete product error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	duplicate = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const product = await this.productService.duplicateProduct(id as string);
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Product duplicated successfully", product, 201);
		} catch (error: any) {
			logger.error(`Duplicate product error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	archive = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const product = await this.productService.archiveProduct(id as string);
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, `Product status updated to ${product.status}`, product);
		} catch (error: any) {
			logger.error(`Archive product error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	updateStock = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const { stock } = req.body;
			if (typeof stock !== "number" || stock < 0) {
				return sendError(res, "Valid non-negative stock quantity required", 400);
			}
			const product = await this.productService.updateStock(id as string, stock);
			memoryCache.invalidatePrefix("products:");
			return sendSuccess(res, "Stock updated successfully", product);
		} catch (error: any) {
			logger.error(`Update stock error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	search = async (req: AuthRequest, res: Response) => {
		try {
			const { q } = req.query;
			const products = await this.productService.searchProducts(q as string);
			return sendSuccess(res, "Search results retrieved", products);
		} catch (error: any) {
			logger.error(`Search products error: ${error.message}`);
			return sendError(res, error.message);
		}
	};

	getRelated = async (req: AuthRequest, res: Response) => {
		try {
			const { id } = req.params;
			const products = await this.productService.getRelatedProducts(
				id as string,
			);
			return sendSuccess(res, "Related products retrieved", products);
		} catch (error: any) {
			logger.error(`Related products error: ${error.message}`);
			return sendError(res, error.message);
		}
	};

	/**
	 * Generate SKU for category
	 * GET /products/generate-sku?category=anklets
	 */
	generateSku = async (req: AuthRequest, res: Response) => {
		try {
			const { category } = req.query;
			logger.info(
				`🔍 SKU Generation Request received for category: ${category}`,
			);

			if (!category || typeof category !== "string") {
				logger.warn("❌ SKU Generation failed: Category is required");
				return sendError(res, "Category is required", 400);
			}

			const sku = await SkuGeneratorService.generateSku(category);

			logger.info(`✅ SKU Generated: ${sku}`);
			return sendSuccess(res, "SKU generated successfully", { sku });
		} catch (error: any) {
			logger.error(`❌ Generate SKU error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	/**
	 * Generate tagline suggestions
	 * POST /products/generate-tagline
	 * Body: { productName, categoryId, sku? }
	 */
	generateTagline = async (req: AuthRequest, res: Response) => {
		try {
			const { productName, categoryId, sku } = req.body;

			if (!productName || !categoryId) {
				return sendError(res, "Product name and category are required", 400);
			}

			const suggestions = TaglineGeneratorService.generateMultipleSuggestions(
				productName,
				categoryId,
				3,
			);

			return sendSuccess(res, "Tagline suggestions generated", { suggestions });
		} catch (error: any) {
			logger.error(`Generate tagline error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	/**
	 * Generate product description
	 * POST /products/generate-description
	 * Body: { tagline, productName, categoryId, platingType?, material? }
	 */
	generateDescription = async (req: AuthRequest, res: Response) => {
		try {
			const { tagline, productName, categoryId, platingType, material } =
				req.body;

			if (!tagline || !productName || !categoryId) {
				return sendError(
					res,
					"Tagline, product name, and category are required",
					400,
				);
			}

			const description = DescriptionGeneratorService.generateDescription(
				tagline,
				productName,
				categoryId,
				platingType,
				material,
			);

			return sendSuccess(res, "Description generated successfully", {
				description,
			});
		} catch (error: any) {
			logger.error(`Generate description error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	/**
	 * Upload product images
	 * POST /products/upload-images
	 * Multipart form data with 'images' field (1-4 files)
	 * Body: { sku, index }
	 */
	uploadImages = async (req: AuthRequest, res: Response) => {
		try {
			const { sku } = req.body;

			if (!sku) {
				return sendError(res, "SKU is required", 400);
			}

			const files = req.files as Express.Multer.File[];

			if (!files || files.length === 0) {
				return sendError(res, "At least one image is required", 400);
			}

			// Process, Convert, and Save
			const imageUrls = await ImageUploadService.uploadProductImages(
				req,
				files,
			);

			console.log(
				`[UPLOAD] ✅ Successfully processed ${files.length} image(s) to JPEG for SKU: ${sku}`,
			);
			console.log(`[UPLOAD] 📁 Public URLs:`, imageUrls);

			return sendSuccess(res, "Images uploaded and converted successfully", {
				imageUrls,
			});
		} catch (error: any) {
			logger.error(`[UPLOAD] ❌ Upload/Conversion error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};
}

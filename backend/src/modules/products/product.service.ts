import { ProductRepository } from "./product.repository";
import { Product, Prisma, ProductStatus } from "@prisma/client";
import { env } from "../../config/env";
import { slugify } from "../../utils/slugify";
import { eventBus, DomainEvent } from "../../core/events/event-bus";

export class ProductService {
	private repository: ProductRepository;

	constructor() {
		this.repository = new ProductRepository();
	}

	async getAllProducts(query: any = {}) {
		const opts = typeof query === "string" ? { category: query } : (query || {});
		const {
			category,
			search,
			gender,
			status,
			limit = 20,
			offset = 0,
			isAdmin = false,
		} = opts;
		const where: Prisma.ProductWhereInput = {};

		// Public only sees active, and even for admins we default to active on the public shop
		where.isActive = true;

		if (!isAdmin) {
			(where as any).status = "ACTIVE";
		} else if (status) {
			(where as any).status = status;
			// If an admin asks for a specific status, they might be looking for INACTIVE ones
			if (status === "INACTIVE" || status === "ARCHIVED") {
				delete where.isActive;
			}
		}

		if (category) {
			where.category = {
				is: { slug: category },
			} as any;
		}

		if (gender && gender !== "ALL") {
			(where as any).gender = gender;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ sku: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
				{ id: { contains: search, mode: "insensitive" } },
			];
		}

		const products = await this.repository.findAll({
			where,
			take: parseInt(limit.toString()),
			skip: parseInt(offset.toString()),
			orderBy: { createdAt: "desc" },
		});

		const total = await this.repository.count(where);

		return {
			products: products.map((p) => this.normalizeProduct(p)),
			pagination: {
				total,
				limit: parseInt(limit.toString()),
				offset: parseInt(offset.toString()),
			},
		};
	}

	async getProductById(id: string) {
		const product = await this.repository.findById(id);
		if (!product) {
			throw new Error("Product not found");
		}
		return this.normalizeProduct(product);
	}

	/**
	 * Normalize product object and fully qualify image URLs
	 */
	private normalizeProduct(product: any) {
		if (!product) return null;

		const normalized = { ...product };

		// Ensure images are fully qualified URLs
		if (normalized.images && Array.isArray(normalized.images)) {
			normalized.images = normalized.images.map((img: string) => {
				if (img.startsWith("http")) return img;
				// If it's a relative path, prefix with backend URL
				const baseUrl = env.BACKEND_URL || "http://localhost:8080";
				return `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
			});
		}

		return normalized;
	}

	async getProductBySlug(slug: string, viewerUserId?: string) {
		const product = await this.repository.findBySlug(slug);
		if (!product) {
			throw new Error("Product not found");
		}

		// Emit PRODUCT_VIEWED for UPIS telemetry
		try {
			eventBus.emitDomainEvent(
				DomainEvent.PRODUCT_VIEWED,
				{
					productId: product.id,
					productName: product.name,
					slug: product.slug,
					userId: viewerUserId || undefined,
					source: "product_detail_page",
				},
				{ actor: viewerUserId || "GUEST" },
			);
		} catch (e) {
			// Never block product rendering for telemetry
		}
		return this.normalizeProduct(product);
	}

	async createProduct(data: any) {
		try {
			const slug = slugify(data.name);

			// Check for existing slug
			const existing = await this.repository.findBySlug(slug);
			if (existing) {
				// Append random string if slug exists
				data.slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
			} else {
				data.slug = slug;
			}

			// Ensure categoryId is provided
			if (!data.categoryId) {
				throw new Error("Category ID is required");
			}

			// AUTO-GENERATE SKU if not provided (ATOMIC PRODUCT CREATION)
			if (!data.sku || data.sku === "" || data.sku === "GENERATING...") {
				const { SkuGeneratorService } = await import(
					"../../services/sku-generator.service"
				);
				const generatedSku = await SkuGeneratorService.generateSku(
					data.categoryId,
				);

				if (!generatedSku) {
					throw new Error(
						"SKU generation failed - service returned empty value",
					);
				}

				data.sku = generatedSku;
				console.log(
					`[PRODUCT_CREATE] Auto-generated SKU: ${generatedSku} for category: ${data.categoryId}`,
				);
			} else {
				// Validate provided SKU
				const existingSku = await this.repository.findBySku(data.sku);
				if (existingSku) {
					throw new Error("Product with this SKU already exists");
				}
			}

			// Create product
			const product = await this.repository.create(data);
			console.log(
				`[PRODUCT_CREATE] ✅ Product created successfully: ${product.id} (SKU: ${product.sku})`,
			);

			return product;
		} catch (error: any) {
			console.error("[PRODUCT_CREATE] ❌ FATAL ERROR:", {
				message: error.message,
				productName: data.name,
				categoryId: data.categoryId,
				providedSku: data.sku,
				stack: error.stack,
			});
			throw error;
		}
	}

	async updateProduct(id: string, data: any) {
		if (data.name) {
			const slug = slugify(data.name);
			const existing = await this.repository.findBySlug(slug);
			if (existing && existing.id !== id) {
				data.slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
			} else {
				data.slug = slug;
			}
		}

		if (data.sku) {
			const existingSku = await this.repository.findBySku(data.sku);
			if (existingSku && existingSku.id !== id) {
				throw new Error("Another product with this SKU already exists");
			}
		}

		return this.repository.update(id, data);
	}

	async deleteProduct(id: string) {
		return this.repository.delete(id);
	}

	async duplicateProduct(id: string) {
		const original = await this.repository.findById(id);
		if (!original) {
			throw new Error("Original product not found");
		}

		const copyName = `${original.name} (Copy)`;
		const copySlug = `${original.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;
		
		const { SkuGeneratorService } = await import("../../services/sku-generator.service");
		let copySku = original.sku ? `${original.sku}-COPY-${Math.floor(100 + Math.random() * 900)}` : "";
		if (!copySku && original.categoryId) {
			copySku = await SkuGeneratorService.generateSku(original.categoryId);
		}

		const duplicateData: any = {
			name: copyName,
			slug: copySlug,
			sku: copySku,
			price: original.price,
			basePrice: original.basePrice,
			sellingPrice: original.sellingPrice,
			ownerPrice: original.ownerPrice,
			categoryId: original.categoryId,
			description: original.description,
			shortTagline: original.shortTagline,
			images: original.images || [],
			thumbnail: original.thumbnail,
			specifications: original.specifications || {},
			careInstructions: original.careInstructions,
			badges: original.badges || [],
			tags: original.tags || [],
			inventory: original.inventory || { quantity: 0 },
			status: "ACTIVE" as ProductStatus,
			isActive: true,
		};

		return this.repository.create(duplicateData);
	}

	async archiveProduct(id: string) {
		const product = await this.repository.findById(id);
		if (!product) throw new Error("Product not found");

		const newStatus = product.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
		const newActive = newStatus === "ACTIVE";

		return this.repository.update(id, {
			status: newStatus as ProductStatus,
			isActive: newActive,
		});
	}

	async updateStock(id: string, stock: number) {
		const product = await this.repository.findById(id);
		if (!product) throw new Error("Product not found");

		const inventoryData: any = typeof product.inventory === "object" && product.inventory !== null
			? { ...product.inventory, quantity: stock }
			: { quantity: stock };

		return this.repository.update(id, {
			inventory: inventoryData,
		});
	}

	async searchProducts(q: string) {
		const where: any = {
			status: "ACTIVE" as ProductStatus,
			isActive: true,
			OR: [
				{ name: { contains: q, mode: "insensitive" } },
				{ sku: { contains: q, mode: "insensitive" } },
				{ description: { contains: q, mode: "insensitive" } },
			],
		};

		return this.repository.findAll({
			where,
			take: 10,
		});
	}

	async getRelatedProducts(productId: string) {
		const product = await this.repository.findById(productId);
		if (!product) return [];

		return this.repository.findAll({
			where: {
				categoryId: (product as any).categoryId,
				id: { not: productId },
				status: "ACTIVE" as ProductStatus,
				isActive: true,
			} as any,
			take: 4,
		});
	}
}

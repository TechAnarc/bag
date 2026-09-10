import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductService } from "../product.service";
import { ProductRepository } from "../product.repository";

vi.mock("../product.repository");

describe("Product Contract Validation", () => {
	let productService: ProductService;
	let productRepository: any;

	beforeEach(() => {
		vi.clearAllMocks();
		productService = new ProductService();
		productRepository = (productService as any).repository;
	});

	it("should return a complete, normalized product object with all required fields", async () => {
		const mockDbProduct = {
			id: "prod-123",
			name: "Gold Necklace",
			slug: "gold-necklace",
			description: "Beautiful gold necklace",
			price: 1500,
			basePrice: 2000,
			sellingPrice: 1500,
			sku: "GN-001",
			images: ["img1.jpg", "https://external.com/img2.jpg"],
			shortTagline: "Elegance defined",
			categoryId: "cat-1",
			platingType: "1 Gram Gold",
			specifications: { weight: "10g" },
			inventory: { quantity: 5 },
			status: "ACTIVE",
			category: { id: "cat-1", name: "Necklace" },
		};

		productRepository.findById.mockResolvedValue(mockDbProduct);

		const result = await productService.getProductById("prod-123");

		// Check for core identity fields
		expect(result.id).toBe(mockDbProduct.id);
		expect(result.name).toBe(mockDbProduct.name);
		expect(result.sku).toBe(mockDbProduct.sku);

		// Check for marketing/content fields
		expect(result.description).toBe(mockDbProduct.description);
		expect(result.shortTagline).toBe(mockDbProduct.shortTagline);

		// Check for pricing alignment
		expect(result.price).toBe(mockDbProduct.price);
		expect(result.basePrice).toBe(mockDbProduct.basePrice);
		expect(result.sellingPrice).toBe(mockDbProduct.sellingPrice);

		// Check for fully qualified image URLs
		expect(result.images).toHaveLength(2);
		expect(result.images[0]).toContain("http");
		expect(result.images[1]).toBe("https://external.com/img2.jpg"); // Already absolute

		// Check for technical/structured fields
		expect(result.specifications).toEqual(mockDbProduct.specifications);
		expect(result.inventory).toEqual(mockDbProduct.inventory);
		expect(result.categoryId).toBe(mockDbProduct.categoryId);
	});

	it("should fail gracefully if the database returns a partial object (though Prisma usually doesn't)", async () => {
		// Simulating an extreme case where some fields are missing from DB
		const incompleteProduct = {
			id: "prod-456",
			name: "Incomplete Prod",
			images: [],
			// missing sku, description, etc.
		};

		productRepository.findById.mockResolvedValue(incompleteProduct);

		const result = await productService.getProductById("prod-456");

		expect(result.id).toBe("prod-456");
		expect(result.images).toEqual([]);
		// The normalization should still handle it without crashing
	});
});

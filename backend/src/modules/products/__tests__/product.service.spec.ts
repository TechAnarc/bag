import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductService } from "../product.service";
import { ProductRepository } from "../product.repository";

vi.mock("../product.repository");

describe("ProductService", () => {
	let productService: ProductService;
	let productRepository: any;

	beforeEach(() => {
		vi.clearAllMocks();
		productService = new ProductService();
		productRepository = (productService as any).repository;
	});

	describe("getAllProducts", () => {
		it("should call findAll with category filter if provided", async () => {
			productRepository.findAll.mockResolvedValue([]);

			await productService.getAllProducts("Necklace");

			expect(productRepository.findAll).toHaveBeenCalledWith({
				category: "Necklace",
			});
		});

		it("should call findAll without filter if no category provided", async () => {
			productRepository.findAll.mockResolvedValue([]);

			await productService.getAllProducts();

			expect(productRepository.findAll).toHaveBeenCalledWith({});
		});
	});

	describe("getProductById", () => {
		it("should throw if product not found", async () => {
			productRepository.findById.mockResolvedValue(null);

			await expect(productService.getProductById("1")).rejects.toThrow(
				"Product not found",
			);
		});

		it("should return product if found", async () => {
			const mockProduct = { id: "1", name: "Necklace" };
			productRepository.findById.mockResolvedValue(mockProduct);

			const result = await productService.getProductById("1");
			expect(result).toEqual(mockProduct);
		});
	});
});

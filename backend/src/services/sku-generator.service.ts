import { prisma } from "../config/database";

/**
 * SKU GENERATOR SERVICE
 * Generates unique, collision-safe SKU IDs for products
 *
 * Pattern: SKUID_NN
 * Example: SKUID_01, SKUID_02, SKUID_15
 */

export class SkuGeneratorService {
	/**
	 * Generate next SKU globally using SKUID_ pattern
	 */
	static async generateSku(categoryIdentifier?: string): Promise<string> {
		try {
			let prefix = "SKUID";
			console.log(
				`[SKU_GEN] 🔍 Generating SKU for category identifier: ${categoryIdentifier || "none"}`,
			);

			// If categoryIdentifier (ID) is provided, resolve its prefix
			if (categoryIdentifier) {
				try {
					// Check if it's already a prefix or a UUID
					const isUuid =
						/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
							categoryIdentifier,
						);

					if (isUuid) {
						const category = await prisma.category.findUnique({
							where: { id: categoryIdentifier },
							select: { skuPrefix: true, name: true },
						});
						if (category?.skuPrefix) {
							prefix = category.skuPrefix;
							console.log(
								`[SKU_GEN] 🏷️ Using category prefix: ${prefix} (from ${category.name})`,
							);
						}
					} else if (
						categoryIdentifier.length >= 2 &&
						categoryIdentifier.length <= 5 &&
						!categoryIdentifier.includes("-")
					) {
						// Probably already a prefix
						prefix = categoryIdentifier.toUpperCase();
					} else {
						// Try fetching by slug or name
						const category = await prisma.category.findFirst({
							where: {
								OR: [
									{ slug: categoryIdentifier },
									{ id: categoryIdentifier },
									{ name: { equals: categoryIdentifier, mode: "insensitive" } },
								],
							},
							select: { skuPrefix: true, name: true },
						});
						if (category?.skuPrefix) {
							prefix = category.skuPrefix;
							console.log(
								`[SKU_GEN] 🏷️ Using category prefix: ${prefix} (from ${category.name}) by slug/name/id`,
							);
						}
					}
				} catch (catErr) {
					console.warn(
						`[SKU_GEN] ⚠️ Could not resolve category prefix, falling back to ${prefix}`,
					);
				}
			}

			// Scan all existing SKUs with THIS prefix to find the next number
			const products = await prisma.product.findMany({
				where: {
					sku: {
						startsWith: `${prefix}_`,
					},
				},
				select: {
					sku: true,
				},
			});

			let nextNumber = 1;
			if (products.length > 0) {
				const nums = products
					.map((p) => {
						if (!p.sku) return 0;
						const parts = p.sku.split("_");
						const numPart =
							parts.length > 1 ? parts[1] : parts[0].replace(prefix, "");
						return parseInt(numPart, 10);
					})
					.filter((n) => !isNaN(n) && n > 0);

				if (nums.length > 0) {
					nextNumber = Math.max(...nums) + 1;
				}
			}

			// Format with 2-digit padding as requested (prefix_01)
			const formattedNumber = nextNumber.toString().padStart(2, "0");
			const newSku = `${prefix}_${formattedNumber}`;

			console.log(
				`[SKU_GEN] ✅ Generated SKU: ${newSku} (prefix: ${prefix}, next: ${nextNumber})`,
			);
			return newSku;
		} catch (error: any) {
			console.error("[SKU_GEN] ❌ CRITICAL ERROR:", {
				message: error.message,
				categoryIdentifier,
				stack: error.stack,
			});

			// Fallback: timestamp-based SKU (collision-resistant)
			const fallbackSku = `SKUID_${Date.now().toString().slice(-6)}`;
			console.warn(`[SKU_GEN] ⚠️  Using fallback SKU: ${fallbackSku}`);
			return fallbackSku;
		}
	}

	/**
	 * Validate SKU format
	 */
	static validateSkuFormat(sku: string): boolean {
		const pattern = /^SKUID_\d{2,}$/;
		return pattern.test(sku);
	}

	/**
	 * Check if SKU already exists
	 */
	static async isSkuUnique(sku: string): Promise<boolean> {
		const exists = await prisma.product.findUnique({
			where: { sku },
		});
		return !exists;
	}
}

/**
 * CATEGORY MASTER REGISTRY
 * Single source of truth for all product categories
 * Used by: Admin UI, SKU Generator, Validation
 */

export interface CategoryMaster {
	id: string;
	displayName: string;
	skuPrefix: string;
	displayCount: number;
	slug: string;
}

export const CATEGORY_MASTER: CategoryMaster[] = [
	{
		id: "tote-bags",
		displayName: "Tote Bags",
		skuPrefix: "TOT",
		displayCount: 49,
		slug: "tote-bags",
	},
	{
		id: "handbags",
		displayName: "Handbags",
		skuPrefix: "HND",
		displayCount: 45,
		slug: "handbags",
	},
	{
		id: "backpacks",
		displayName: "Backpacks",
		skuPrefix: "BCK",
		displayCount: 41,
		slug: "backpacks",
	},
	{
		id: "clutches",
		displayName: "Clutches",
		skuPrefix: "CLT",
		displayCount: 0,
		slug: "clutches",
	},
	{
		id: "laptop-bags",
		displayName: "Laptop Bags",
		skuPrefix: "LPT",
		displayCount: 0,
		slug: "laptop-bags",
	},
	{
		id: "travel-bags",
		displayName: "Travel Bags",
		skuPrefix: "TRV",
		displayCount: 0,
		slug: "travel-bags",
	},
	{
		id: "crossbody-bags",
		displayName: "Crossbody Bags",
		skuPrefix: "CRB",
		displayCount: 0,
		slug: "crossbody-bags",
	},
	{
		id: "wallets",
		displayName: "Wallets",
		skuPrefix: "WLT",
		displayCount: 0,
		slug: "wallets",
	},
	{
		id: "sling-bags",
		displayName: "Sling Bags",
		skuPrefix: "SLN",
		displayCount: 0,
		slug: "sling-bags",
	},
	{
		id: "duffle-bags",
		displayName: "Duffle Bags",
		skuPrefix: "DUF",
		displayCount: 0,
		slug: "duffle-bags",
	}
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): CategoryMaster | undefined {
	return CATEGORY_MASTER.find((cat) => cat.id === id);
}

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): CategoryMaster | undefined {
	return CATEGORY_MASTER.find((cat) => cat.slug === slug);
}

/**
 * Get SKU prefix for category
 */
export function getSkuPrefix(categoryId: string): string {
	const category = getCategoryById(categoryId);
	if (!category) {
		throw new Error(`Invalid category ID: ${categoryId}`);
	}
	return category.skuPrefix;
}

/**
 * Validate category ID
 */
export function isValidCategory(categoryId: string): boolean {
	return CATEGORY_MASTER.some((cat) => cat.id === categoryId);
}

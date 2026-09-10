import { getCategoryById } from "../constants/categories.constant";

/**
 * TAGLINE GENERATOR SERVICE
 * Generate smart, context-aware taglines for products
 * Considers: Product name, Category, SKU
 */

export class TaglineGeneratorService {
	private static taglineTemplates: Record<string, string[]> = {
		"tote-bags": [
			"Graceful tote crafted for everyday elegance",
			"Spacious charm meets modern design",
			"Carry your essentials with timeless beauty",
			"Delicate craftsmanship for your daily journey",
		],
		handbags: [
			"Exquisite handbags for the modern woman",
			"Traditional elegance, contemporary style",
			"Handcrafted brilliance for every occasion",
			"Timeless beauty in every detail",
		],
		backpacks: [
			"Elegant backpack designed to celebrate you",
			"Premium craftsmanship, unforgettable style",
			"Wear your story with pride",
			"Crafted for moments that matter",
		],
		clutches: [
			"Statement clutch for the bold",
			"Designed to celebrate your unique elegance",
			"Where tradition meets contemporary charm",
			"Handcrafted luxury for special occasions",
		],
		default: [
			"Handcrafted with love and precision",
			"Premium quality for discerning taste",
			"Designed to make you shine",
			"Celebrate life's special moments",
		],
	};

	/**
	 * Generate smart tagline based on product context
	 */
	static generateTagline(
		productName: string,
		categoryId: string,
		sku?: string,
	): string {
		const category = getCategoryById(categoryId);
		const categoryName = category?.displayName.toLowerCase() || "bag";

		// Get templates for this category
		const templates =
			this.taglineTemplates[categoryId] ||
			this.taglineTemplates[categoryName] ||
			this.taglineTemplates.default;

		// Pick a random template
		const template = templates[Math.floor(Math.random() * templates.length)];

		// Try to personalize based on product name
		const personalizedTagline = this.personalizeTagline(
			template,
			productName,
			categoryName,
		);

		return personalizedTagline;
	}

	/**
	 * Personalize tagline based on product name
	 */
	private static personalizeTagline(
		template: string,
		productName: string,
		categoryName: string,
	): string {
		const nameLower = productName.toLowerCase();

		// Detect design patterns
		if (nameLower.includes("royal") || nameLower.includes("regal")) {
			return "Regal elegance for your royal moments";
		}

		if (nameLower.includes("vintage") || nameLower.includes("antique")) {
			return "Vintage charm with timeless appeal";
		}

		if (nameLower.includes("contemporary") || nameLower.includes("modern")) {
			return "Contemporary design meets traditional craftsmanship";
		}

		if (nameLower.includes("bridal") || nameLower.includes("wedding")) {
			return "Designed for your most precious moments";
		}

		if (nameLower.includes("daily") || nameLower.includes("everyday")) {
			return "Everyday luxury for the modern you";
		}

		// Default to template
		return template;
	}

	/**
	 * Generate multiple tagline suggestions
	 */
	static generateMultipleSuggestions(
		productName: string,
		categoryId: string,
		count: number = 3,
	): string[] {
		const suggestions: string[] = [];
		const category = getCategoryById(categoryId);
		const categoryName = category?.displayName.toLowerCase() || "bag";

		const templates =
			this.taglineTemplates[categoryId] ||
			this.taglineTemplates[categoryName] ||
			this.taglineTemplates.default;

		// Generate unique suggestions
		const usedIndices = new Set<number>();

		while (suggestions.length < count && usedIndices.size < templates.length) {
			const index = Math.floor(Math.random() * templates.length);

			if (!usedIndices.has(index)) {
				usedIndices.add(index);
				const tagline = this.personalizeTagline(
					templates[index],
					productName,
					categoryName,
				);
				suggestions.push(tagline);
			}
		}

		return suggestions;
	}
}

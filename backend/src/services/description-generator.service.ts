import { getCategoryById } from "../constants/categories.constant";

/**
 * INTELLIGENT DESCRIPTION GENERATOR SERVICE
 * Auto-generate distinct, impressive product descriptions based on name, category and sentiment.
 */

interface DescriptionContext {
	plating: string;
	material: string;
	catName: string;
	isMens: boolean;
	vibe:
		| "royal"
		| "spiritual"
		| "elegant"
		| "modern"
		| "heritage"
		| "delicate"
		| "bold";
}

export class DescriptionGeneratorService {
	/**
	 * Generate product description from tagline
	 */
	static generateDescription(
		tagline: string,
		productName: string,
		categoryId: string,
		platingType?: string,
		material?: string,
	): string {
		const category = getCategoryById(categoryId);
		const catName = (category?.displayName || "Bag").toLowerCase();
		const nameLower = productName.toLowerCase();

		// 1. Determine Vibe
		let vibe: DescriptionContext["vibe"] = "elegant";
		if (
			nameLower.includes("imperial") ||
			nameLower.includes("royal") ||
			nameLower.includes("majestic")
		)
			vibe = "royal";
		else if (
			nameLower.includes("divine") ||
			nameLower.includes("sacred") ||
			nameLower.includes("rudraksha") ||
			nameLower.includes("mala")
		)
			vibe = "spiritual";
		else if (
			nameLower.includes("heritage") ||
			nameLower.includes("antique") ||
			nameLower.includes("traditional")
		)
			vibe = "heritage";
		else if (
			nameLower.includes("eternal") ||
			nameLower.includes("shine") ||
			nameLower.includes("velvet")
		)
			vibe = "elegant";
		else if (
			nameLower.includes("bold") ||
			nameLower.includes("kada") ||
			nameLower.includes("signature")
		)
			vibe = "bold";
		else if (
			nameLower.includes("delicate") ||
			nameLower.includes("charm") ||
			nameLower.includes("classic")
		)
			vibe = "delicate";
		else if (nameLower.includes("modern") || nameLower.includes("contemporary"))
			vibe = "modern";

		// 2. Determine Gender
		const isMens =
			nameLower.includes("men") ||
			nameLower.includes("boy") ||
			catName.includes("men");

		const context: DescriptionContext = {
			plating: platingType || "Premium Vegan Leather",
			material: material || "high-quality canvas base",
			catName,
			isMens,
			vibe,
		};

		// 3. Assemble components
		const sentences: string[] = [];

		// Tagline as prefix if exists
		if (tagline && tagline.trim()) {
			sentences.push(tagline.endsWith(".") ? tagline : `${tagline}.`);
		}

		sentences.push(this.getOpener(productName, context));
		sentences.push(this.getDetails(context));
		sentences.push(this.getUsage(context));
		sentences.push(this.getClosing(context));

		return sentences.join(" ");
	}

	private static getOpener(name: string, ctx: DescriptionContext): string {
		const templates = {
			royal: [
				`Transform your presence with the ${name}, a masterpiece of royal aesthetics and grandeur.`,
				`The ${name} is an embodiment of majestic luxury, designed for those who command respect.`,
				`Elevate your style to imperial heights with this exceptionally crafted ${ctx.catName}.`,
			],
			spiritual: [
				`Embrace the positive energies and spiritual grace of this ${name}.`,
				`A perfect blend of divine tradition and modern craftsmanship, this ${name} is more than just an accessory.`,
				`The ${name} serves as a sacred companion, meticulously crafted to reflect your inner peace and strength.`,
			],
			heritage: [
				`Celebrate the rich tapestry of Indian tradition with the ${name}, featuring motifs inspired by heritage artistry.`,
				`The ${name} brings back the timeless allure of antique craftsmanship with a contemporary twist.`,
				`Painstakingly designed to reflect heritage elegance, this ${ctx.catName} is a tribute to classic bag making.`,
			],
			elegant: [
				`The ${name} defines sophisticated grace, making it a stellar addition to any refined accessory collection.`,
				`Experience the perfect harmony of brilliance and subtlety with this exquisite ${name}.`,
				`Crafted for the modern ${ctx.isMens ? "gentleman" : "woman"}, the ${name} radiates an aura of effortless elegance.`,
			],
			bold: [
				`Command attention with the ${name}, featuring a bold design that speaks volumes about your personality.`,
				`The ${name} is crafted for those who aren't afraid to make a statement with their style.`,
				`Featuring a signature design, this ${name} adds an edge of confidence to your ensemble.`,
			],
			delicate: [
				`Add a subtle hint of charm to your look with the beautifully delicate ${name}.`,
				`The ${name} is a fine example of understated beauty, perfect for a refined and minimal aesthetic.`,
				`Meticulously designed for a lightweight and graceful feel, this ${ctx.catName} is a joy to wear.`,
			],
			modern: [
				`Discover the intersection of contemporary design and expert accessory making with the ${name}.`,
				`The ${name} features a modern silhouette that complements the style of the today's trendsetters.`,
				`Upgrade your accessory game with this sleek and stylishly designed ${ctx.catName}.`,
			],
		};

		const options = templates[ctx.vibe] || templates.elegant;
		return options[Math.floor(Math.random() * options.length)];
	}

	private static getDetails(ctx: DescriptionContext): string {
		const options = [
			`Hand-finished with ${ctx.plating} over a ${ctx.material}, it promises a brilliant shine that rivals luxury items.`,
			`This piece is expertly crafted using ${ctx.plating} on a ${ctx.material} to ensure a premium look and feel.`,
			`Combining the richness of ${ctx.plating} and the durability of ${ctx.material}, it offers an unmatched artisanal finish.`,
			`Each detail is polished to perfection, featuring high-quality ${ctx.plating} on a carefully selected ${ctx.material}.`,
		];
		return options[Math.floor(Math.random() * options.length)];
	}

	private static getUsage(ctx: DescriptionContext): string {
		if (ctx.isMens) {
			return [
				`Perfect for formal gatherings, festive occasions, or as a powerful everyday accessory.`,
				`Whether paired with ethnic wear or formal attire, this piece adds a layer of distinction.`,
				`Designed to withstand daily use while maintaining its impressive look, it's an essential for the modern man.`,
			][Math.floor(Math.random() * 3)];
		}

		if (ctx.vibe === "spiritual" || ctx.vibe === "heritage") {
			return [
				`Ideally suited for traditional ceremonies, weddings, and festive celebrations.`,
				`A timeless addition to your bridal or festive trousseau that will be cherished for years.`,
				`Pair it with your favorite ethnic ensemble to complete a look of traditional splendor.`,
			][Math.floor(Math.random() * 3)];
		}

		return [
			`Seamlessly transitions from high-profile events to casual evening gatherings.`,
			`A versatile choice that adds a touch of sophistication to both modern and traditional outfits.`,
			`Exquisitely designed to be the centerpiece of your ensemble, regardless of the occasion.`,
		][Math.floor(Math.random() * 3)];
	}

	private static getClosing(ctx: DescriptionContext): string {
		const options = [
			`Built with a focus on durability, its high-quality finish ensures it remains a favorite in your collection for years.`,
			`A premium accessory closet companion that stays as radiant as your first wear with simple basic care.`,
			`Engineered for longevity, this piece maintains its luster and intricate detailing over time.`,
			`Its superior build quality and timeless design make it an ideal gift for yourself or a loved one.`,
		];
		return options[Math.floor(Math.random() * options.length)];
	}

	static generateShortDescription(
		productName: string,
		categoryId: string,
	): string {
		const category = getCategoryById(categoryId);
		const categoryName = category?.displayName || "bag";
		return `Premium ${categoryName.toLowerCase()} featuring ${productName.toLowerCase()}. Handcrafted with premium materials. Perfect for all occasions.`;
	}
}

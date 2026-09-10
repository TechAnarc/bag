import { PrismaClient } from "@prisma/client";
import { slugify } from "../../utils/slugify";

const prisma = new PrismaClient();

export class SeoService {
	private baseUrl = "https://triveni1gram.in";

	async generateSitemapIndex(): Promise<string> {
		const sitemaps = [
			"sitemap_pages.xml",
			"sitemap_products.xml",
			"sitemap_categories.xml",
			"sitemap_images.xml",
		];

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml +=
			'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

		for (const sitemap of sitemaps) {
			xml += "  <sitemap>\n";
			xml += `    <loc>${this.baseUrl}/${sitemap}</loc>\n`;
			xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
			xml += "  </sitemap>\n";
		}

		xml += "</sitemapindex>";
		return xml;
	}

	async generatePagesSitemap(): Promise<string> {
		const pages = [
			{ url: "/", priority: "1.0", changefreq: "daily" },
			{ url: "/shop", priority: "0.9", changefreq: "daily" },
			{ url: "/about", priority: "0.7", changefreq: "monthly" },
			{ url: "/contact", priority: "0.7", changefreq: "monthly" },
			{ url: "/wishlist", priority: "0.5", changefreq: "weekly" },
			{ url: "/cart", priority: "0.3", changefreq: "weekly" },
		];

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

		for (const page of pages) {
			xml += "  <url>\n";
			xml += `    <loc>${this.baseUrl}${page.url}</loc>\n`;
			xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
			xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
			xml += `    <priority>${page.priority}</priority>\n`;
			xml += "  </url>\n";
		}

		xml += "</urlset>";
		return xml;
	}

	async generateProductsSitemap(): Promise<string> {
		const products = await prisma.product.findMany({
			where: { isActive: true },
			select: { id: true, slug: true, updatedAt: true },
		});

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

		for (const product of products) {
			if (!product.slug) continue;

			// 🛡️ Automated Sitemap Validation Layer
			const canonicalSlug = slugify(product.slug);
			if (product.slug !== canonicalSlug) {
				console.warn(
					`⚠️ [SEO] Skipping malformed product slug in sitemap: ${product.slug}`,
				);
				continue;
			}

			const path = `/product/${canonicalSlug}`;
			const url = `${this.baseUrl}${path}`;
			xml += "  <url>\n";
			xml += `    <loc>${this.escapeXml(url)}</loc>\n`;
			xml += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
			xml += "    <changefreq>weekly</changefreq>\n";
			xml += "    <priority>0.8</priority>\n";
			xml += "  </url>\n";
		}

		xml += "</urlset>";
		return xml;
	}

	async generateCategoriesSitemap(): Promise<string> {
		const categories = await prisma.category.findMany({
			select: { id: true, slug: true, updatedAt: true },
		});

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

		// Always inject high-priority static/marketing categories to ensure 100% uptime indexing coverage
		const highPriorityCategories = [
			{ slug: "necklaces", updatedAt: new Date() },
		];

		// Merge both DB and high-priority lists, ensuring no duplicates
		const combinedCategories = [...categories];
		for (const hp of highPriorityCategories) {
			if (!combinedCategories.some((c) => c.slug === hp.slug)) {
				combinedCategories.push({
					id: `virtual-${hp.slug}`,
					slug: hp.slug,
					updatedAt: hp.updatedAt,
				} as any);
			}
		}

		for (const category of combinedCategories) {
			if (!category.slug) continue;

			// 🛡️ Automated Sitemap Validation Layer
			const canonicalSlug = slugify(category.slug);
			if (category.slug !== canonicalSlug) {
				console.warn(
					`⚠️ [SEO] Skipping malformed category slug in sitemap: ${category.slug}`,
				);
				continue;
			}

			const path = `/category/${canonicalSlug}`;
			const url = `${this.baseUrl}${path}`;
			xml += "  <url>\n";
			xml += `    <loc>${this.escapeXml(url)}</loc>\n`;
			xml += `    <lastmod>${category.updatedAt.toISOString()}</lastmod>\n`;
			xml += "    <changefreq>daily</changefreq>\n";
			xml += "    <priority>0.9</priority>\n";
			xml += "  </url>\n";
		}

		xml += "</urlset>";
		return xml;
	}

	async generateImagesSitemap(): Promise<string> {
		const products = await prisma.product.findMany({
			where: { isActive: true },
			select: {
				id: true,
				slug: true,
				name: true,
				images: true,
			},
		});

		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml +=
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

		for (const product of products) {
			if (!product.slug) continue;

			const canonicalSlug = slugify(product.slug);
			if (product.slug !== canonicalSlug) continue;

			const path = `/product/${canonicalSlug}`;
			const url = `${this.baseUrl}${path}`;
			const images = Array.isArray(product.images) ? product.images : [];

			if (images.length > 0) {
				xml += "  <url>\n";
				xml += `    <loc>${this.escapeXml(url)}</loc>\n`;
				for (const image of images) {
					const imageUrl =
						typeof image === "string" ? image : (image as any).url;
					if (imageUrl) {
						xml += "    <image:image>\n";
						xml += `      <image:loc>${this.escapeXml(imageUrl)}</image:loc>\n`;
						xml += `      <image:title>${this.escapeXml(product.name)}</image:title>\n`;
						xml += "    </image:image>\n";
					}
				}
				xml += "  </url>\n";
			}
		}

		xml += "</urlset>";
		return xml;
	}

	private escapeXml(unsafe: string): string {
		return unsafe.replace(/[<>&"']/g, (c) => {
			switch (c) {
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case "&":
					return "&amp;";
				case '"':
					return "&quot;";
				case "'":
					return "&apos;";
				default:
					return c;
			}
		});
	}
}

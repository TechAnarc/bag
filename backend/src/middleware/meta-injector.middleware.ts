import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * MetaInjector Middleware
 * Injects dynamic SEO metadata into the index.html for specific routes
 * to ensure bots receive fully rendered meta tags without JS.
 */
export const metaInjectorMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Skip for API, static assets, etc.
	if (
		req.path.startsWith("/api/") ||
		req.path.startsWith("/assets/") ||
		req.path.startsWith("/uploads/") ||
		req.path.includes(".")
	) {
		return next();
	}

	const indexPath = path.join(process.cwd(), "public", "index.html");
	if (!fs.existsSync(indexPath)) {
		return next();
	}

	try {
		let html = fs.readFileSync(indexPath, "utf8");
		let title = "Bombay Bag House";
		let description = "Premium luxury bags and accessories collection";
		let ogImage = "https://trivenibombaybaghouse.vercel.app/assets/triveni-brand-logo.png";
		let structuredData: any = null;

		// Handle Product Detail Page
		if (req.path.startsWith("/product/")) {
			const slug = req.path.split("/")[2];
			if (slug) {
				const product = await prisma.product.findFirst({
					where: { OR: [{ slug }, { id: slug }] },
					include: { category: true },
				});

				if (product) {
					title = `${product.name} | Bombay Bag House`;
					description =
						product.description ||
						`Buy ${product.name} at Bombay Bag House. Premium quality luxury bags and accessories.`;
					const images = product.images as string[];
					if (images && images.length > 0) {
						ogImage = images[0];
					}

					structuredData = {
						"@context": "https://schema.org/",
						"@type": "Product",
						name: product.name,
						image: images,
						description: description,
						sku: product.id,
						brand: { "@type": "Brand", name: "BombayBagHouse" },
						offers: {
							"@type": "Offer",
							url: `https://trivenibombaybaghouse.vercel.app/product/${product.slug || product.id}`,
							priceCurrency: "INR",
							price: (product.sellingPrice || product.price).toString(),
							availability: "https://schema.org/InStock",
							itemCondition: "https://schema.org/NewCondition",
						},
					};
				}
			}
		}
		// Handle Category Page
		else if (req.path.startsWith("/category/")) {
			const slug = req.path.split("/")[2];
			if (slug) {
				const category = await prisma.category.findFirst({
					where: { OR: [{ slug }, { id: slug }] },
				});

				if (category) {
					title = `${category.name} Collection | Bombay Bag House`;
					description = `Explore our ${category.name.toLowerCase()} collection. Premium handcrafted luxury bags and accessories.`;
				}
			}
		}

		// Replace meta tags in HTML
		html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
		html = html.replace(
			/<meta name="description" content=".*?" \/>/,
			`<meta name="description" content="${description}" />`,
		);
		html = html.replace(
			/<meta property="og:title" content=".*?" \/>/,
			`<meta property="og:title" content="${title}" />`,
		);
		html = html.replace(
			/<meta property="og:description" content=".*?" \/>/,
			`<meta property="og:description" content="${description}" />`,
		);
		html = html.replace(
			/<meta property="og:image" content=".*?" \/>/,
			`<meta property="og:image" content="${ogImage}" />`,
		);

		// Inject Structured Data
		if (structuredData) {
			const ldJson = `\n    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
			html = html.replace("</head>", `${ldJson}\n  </head>`);
		}

		res.send(html);
	} catch (error) {
		console.error("Meta injection error:", error);
		next();
	}
};

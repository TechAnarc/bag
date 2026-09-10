import { Request, Response } from "express";
import { SeoService } from "./seo.service";

const seoService = new SeoService();

export class SeoController {
	async getSitemapIndex(req: Request, res: Response) {
		try {
			console.log(`[SEO] Serving Sitemap Index to ${req.ip}`);
			const xml = await seoService.generateSitemapIndex();
			res.header("Content-Type", "application/xml");
			res.send(xml);
		} catch (error) {
			console.error("[SEO] Error generating sitemap index:", error);
			res.status(500).send("Internal Server Error");
		}
	}

	async getPagesSitemap(req: Request, res: Response) {
		try {
			console.log(`[SEO] Serving Pages Sitemap to ${req.ip}`);
			const xml = await seoService.generatePagesSitemap();
			res.header("Content-Type", "application/xml");
			res.send(xml);
		} catch (error) {
			console.error("[SEO] Error generating pages sitemap:", error);
			res.status(500).send("Internal Server Error");
		}
	}

	async getProductsSitemap(req: Request, res: Response) {
		try {
			console.log(`[SEO] Serving Products Sitemap to ${req.ip}`);
			const xml = await seoService.generateProductsSitemap();
			res.header("Content-Type", "application/xml");
			res.send(xml);
		} catch (error) {
			console.error("[SEO] Error generating products sitemap:", error);
			res.status(500).send("Internal Server Error");
		}
	}

	async getCategoriesSitemap(req: Request, res: Response) {
		try {
			console.log(`[SEO] Serving Categories Sitemap to ${req.ip}`);
			const xml = await seoService.generateCategoriesSitemap();
			res.header("Content-Type", "application/xml");
			res.send(xml);
		} catch (error) {
			console.error("[SEO] Error generating categories sitemap:", error);
			res.status(500).send("Internal Server Error");
		}
	}

	async getImagesSitemap(req: Request, res: Response) {
		try {
			console.log(`[SEO] Serving Images Sitemap to ${req.ip}`);
			const xml = await seoService.generateImagesSitemap();
			res.header("Content-Type", "application/xml");
			res.send(xml);
		} catch (error) {
			console.error("[SEO] Error generating images sitemap:", error);
			res.status(500).send("Internal Server Error");
		}
	}

	async getRobotsTxt(req: Request, res: Response) {
		const robotsTxt = `# triveni1gram.in production robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /cart/
Disallow: /checkout/
Disallow: /account/
Disallow: /login/
Disallow: /register/
Disallow: /search?*
Disallow: /*?*sessionid=
Disallow: /*?*sid=
Disallow: /*?*utm_

# Allow critical rendering resources
Allow: /assets/
Allow: /css/
Allow: /js/
Allow: /*.css$
Allow: /*.js$

# Sitemap declaration
Sitemap: https://triveni1gram.in/sitemap.xml
Sitemap: https://triveni1gram.in/sitemap_index.xml`;

		res.header("Content-Type", "text/plain");
		res.send(robotsTxt);
	}

	async getLogo(req: Request, res: Response) {
		try {
			const path = require("path");
			const fs = require("fs");
			const logoPath = path.join(process.cwd(), "public/assets/logo.png");

			if (fs.existsSync(logoPath)) {
				res.sendFile(logoPath);
			} else {
				res.status(404).send("Logo not found");
			}
		} catch (error) {
			console.error("Error serving logo:", error);
			res.status(500).send("Internal Server Error");
		}
	}
}

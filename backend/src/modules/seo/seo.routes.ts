import { Router } from "express";
import { SeoController } from "./seo.controller";

const router = Router();
const seoController = new SeoController();

// Sitemap routes
router.get("/sitemap.xml", (req, res) =>
	seoController.getSitemapIndex(req, res),
);
router.get("/sitemap_index.xml", (req, res) =>
	seoController.getSitemapIndex(req, res),
);
router.get("/sitemap_pages.xml", (req, res) =>
	seoController.getPagesSitemap(req, res),
);
router.get("/sitemap_products.xml", (req, res) =>
	seoController.getProductsSitemap(req, res),
);
router.get("/sitemap_categories.xml", (req, res) =>
	seoController.getCategoriesSitemap(req, res),
);
router.get("/sitemap_images.xml", (req, res) =>
	seoController.getImagesSitemap(req, res),
);

// robots.txt route
router.get("/robots.txt", (req, res) => seoController.getRobotsTxt(req, res));

// Logo route
router.get("/logo.png", (req, res) => seoController.getLogo(req, res));

export default router;

import { Request, Response, NextFunction } from "express";

/**
 * Middleware to normalize URLs for SEO:
 * 1. Force lowercase
 * 2. Remove trailing slashes
 * 3. Redirect to canonical version if changed
 */
export const seoNormalizationMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Skip for files, assets, and API routes
	if (
		req.path.includes(".") ||
		req.path.startsWith("/api/") ||
		req.path.startsWith("/assets/") ||
		req.path.startsWith("/uploads/")
	) {
		return next();
	}

	const originalPath = req.path;
	let normalizedPath = originalPath.toLowerCase();

	// Remove trailing slash if not root
	if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
		normalizedPath = normalizedPath.slice(0, -1);
	}

	if (normalizedPath !== originalPath) {
		const query = req.url.slice(req.path.length);
		return res.redirect(301, normalizedPath + query);
	}

	next();
};

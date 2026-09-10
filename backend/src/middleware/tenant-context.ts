import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const tenantContextMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Strategy 1: Header (For Admin/API)
	const tenantIdFromHeader = req.headers["x-tenant-id"] as string;

	// Strategy 2: Subdomain (For Customer Storefront)
	const host = req.headers.host || "";
	const subdomain = host.split(".")[0];

	// For now, prioritize Header, then fallback to subdomain if not 'localhost' or 'api'
	let tenantId = tenantIdFromHeader;

	if (
		!tenantId &&
		subdomain &&
		!["localhost", "api", "www", "bombay"].includes(subdomain)
	) {
		tenantId = subdomain;
	}

	// Default tenant for development if none provided
	if (!tenantId) {
		tenantId = process.env.DEFAULT_TENANT_ID || "bombay_bag_house_main";
	}

	req.tenantId = tenantId;

	// Optional: Log tenant context for debugging
	// logger.debug(`[TenantContext] Request for tenant: ${tenantId}`);

	next();
};

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger } from "../config/logger";

export const requestLogger = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const requestId = (req.headers["x-request-id"] as string) || randomUUID();
	req.id = requestId;
	res.setHeader("X-Request-ID", requestId);

	const start = Date.now();

	res.on("finish", () => {
		const duration = Date.now() - start;
		logger.info({
			type: "HTTP",
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			duration: `${duration}ms`,
			requestId,
			ip: req.ip,
			user:
				(req as any).user?.email || (req as any).admin?.email || "anonymous",
		});
	});

	next();
};

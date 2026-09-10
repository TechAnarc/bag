import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { sendError } from "../utils/response";

export const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	logger.error(`Unhandled Exception: ${err.message}`);
	logger.error(err.stack);

	if (res.headersSent) {
		return next(err);
	}

	const statusCode = err.status || err.statusCode || 500;
	const message = err.message || "Internal Server Error";

	return sendError(
		res,
		message,
		statusCode,
		process.env.NODE_ENV === "development" ? err.stack : undefined,
	);
};

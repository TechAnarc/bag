import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
	auth?: {
		id: string;
		email: string;
		role: string;
		type: "USER" | "ADMIN";
	};
}

export const authenticate = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	// 1. Unified Cookie Extraction (Standardize on httpOnly)
	let token = req.cookies.access_token;

	// fallback to header for legacy or internal service tools
	if (!token && req.headers.authorization?.startsWith("Bearer ")) {
		token = req.headers.authorization.split(" ")[1];
	}

	if (!token) {
		return sendError(res, "Authentication required", 401);
	}

	try {
		// Use shared access secret for consolidated kernel
		const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

		req.auth = {
			id: payload.sub,
			email: payload.email,
			role: payload.role,
			type: payload.type || "USER", // default to USER
		};

		return next();
	} catch (error) {
		return sendError(res, "Invalid or expired token", 401);
	}
};

export const optionalAuthenticate = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	let token = req.cookies.access_token;

	if (!token && req.headers.authorization?.startsWith("Bearer ")) {
		token = req.headers.authorization.split(" ")[1];
	}

	if (!token) {
		return next();
	}

	try {
		const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

		req.auth = {
			id: payload.sub,
			email: payload.email,
			role: payload.role,
			type: payload.type || "USER",
		};

		return next();
	} catch (error) {
		// Ignore errors for optional authentication
		return next();
	}
};

export const authorize = (...roles: string[]) => {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		if (!req.auth) {
			return sendError(res, "Authentication required", 401);
		}

		if (!roles.includes(req.auth.role)) {
			console.warn(
				`[Auth] Access denied for user ${req.auth.id} (${req.auth.email}). Role: ${req.auth.role}, Required: ${roles.join(",")}`,
			);
			return sendError(
				res,
				"You do not have permission to perform this action",
				403,
			);
		}

		return next();
	};
};

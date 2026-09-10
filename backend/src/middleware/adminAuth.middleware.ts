import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AdminJwtPayload } from "../modules/admin/admin.types";
import { env } from "../config/env";
import { prisma } from "../config/database";

// Extend Express Request to include admin
declare global {
	namespace Express {
		interface Request {
			admin?: AdminJwtPayload;
			auth?: any;
		}
	}
}

export const authenticateAdmin = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		// Read admin token from httpOnly cookie or Authorization header
		let token = req.cookies.admin_access_token;
		let source = "cookie";

		if (!token && req.headers.authorization?.startsWith("Bearer ")) {
			token = req.headers.authorization.split(" ")[1];
			source = "header";
		}

		if (!token) {
			console.log(
				"🔒 [AdminAuth] Access denied - No token found in cookies or headers",
			);
			res.status(401).json({
				success: false,
				message: "Access denied. No token provided.",
			});
			return;
		}

		const secret = env.ADMIN_JWT_SECRET;
		const decoded = jwt.verify(token, secret) as any;
		console.log(
			`🔓 [AdminAuth] Token verified via ${source} for:`,
			decoded.email || decoded.sub,
		);

		// Verify it's an admin token (case-insensitive check for reliability)
		const type = (decoded.type || "").toLowerCase();
		if (type !== "admin") {
			console.warn(`🚫 [AdminAuth] Invalid token type: ${type}`);
			res.status(403).json({
				success: false,
				message: "Invalid token type. Admin access required.",
			});
			return;
		}

		// Map sub and id for compatibility with all controllers
		const adminId = decoded.id || decoded.sub;

		// SECURITY CHECK: Verify admin still exists and is active
		const admin = await prisma.admin.findUnique({
			where: { id: adminId },
			select: { id: true, isActive: true, role: true, email: true },
		});

		if (!admin || !admin.isActive) {
			res.status(401).json({
				success: false,
				message: "Admin account is inactive or not found.",
			});
			return;
		}

		const adminData = {
			id: admin.id,
			email: admin.email,
			role: admin.role,
			type: "admin" as const,
		};

		req.admin = adminData as any;
		req.auth = adminData; // Set req.auth for compatibility with standard controllers

		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			res.status(401).json({
				success: false,
				message: "Token expired. Please login again.",
			});
			return;
		}

		if (error instanceof jwt.JsonWebTokenError) {
			res.status(401).json({
				success: false,
				message: "Invalid token.",
			});
			return;
		}

		console.error("Admin authentication error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error during authentication",
		});
	}
};

export const requireSuperAdmin = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!req.admin) {
		res.status(401).json({
			success: false,
			message: "Authentication required",
		});
		return;
	}

	if (req.admin.role !== "SUPER_ADMIN") {
		res.status(403).json({
			success: false,
			message: "Super Admin access required",
		});
		return;
	}

	next();
};

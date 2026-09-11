import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { commandBus } from "../../core/commands/command-bus";
import { analyticsService } from "../analytics/analytics.service";
import { AuthService } from "../auth/auth.service";
import { AdminService } from "./admin.service";
import {
	adminLoginSchema,
	adminPasswordUpdateSchema,
	adminProfileUpdateSchema,
	blockUserSchema,
	createProductSchema,
	updateOrderStatusSchema,
	updateProductSchema,
} from "./admin.validation";

const googleClient = new OAuth2Client();

const adminService = new AdminService();
const authService = new AuthService();

export class AdminController {
	// ==================== Authentication ====================

	async login(req: Request, res: Response): Promise<void> {
		try {
			console.log("🔓 Admin login attempt for:", req.body.email);
			const validation = adminLoginSchema.safeParse(req.body);

			if (!validation.success) {
				res.status(400).json({
					success: false,
					message: "Validation error",
					errors: validation.error.errors,
				});
				return;
			}

			const result = await adminService.login(validation.data as any);

			// Log login action
			const ipAddress =
				(req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
			const userAgent = req.headers["user-agent"];

			try {
				await adminService.logAction(result.admin.id, {
					action: "ADMIN_LOGIN",
					details: { email: result.admin.email },
					ipAddress,
					userAgent,
				});
			} catch (logLog) {
				console.error("⚠️ Failed to log admin login action:", logLog);
			}

			// 🧠 CONSOLDATED ADMIN AUTH ENGINE
			// We use the admin-specific secret for enhanced isolation
			const adminPayload = {
				id: result.admin.id,
				email: result.admin.email,
				role: result.admin.role,
				type: "admin" as const, // Standardize on lowercase 'admin' as per middleware expectation
			};

			const accessToken = jwt.sign(adminPayload, env.ADMIN_JWT_SECRET, {
				expiresIn: env.ADMIN_JWT_EXPIRES_IN as any,
			});

			// For refresh token, we can still use the core auth service or separate it
			// For now, let's keep it separate for maximum admin channel isolation
			const refreshToken = jwt.sign(
				{ sub: result.admin.id, type: "admin" },
				env.JWT_REFRESH_SECRET,
				{ expiresIn: env.JWT_REFRESH_EXPIRY as any },
			);

			const isProduction = env.NODE_ENV === "production";

			// Set cookies that match the AdminAuthMiddleware expectations
			res.cookie("admin_access_token", accessToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
				maxAge: 24 * 60 * 60 * 1000, // 24 hours to match ADMIN_JWT_EXPIRES_IN default
			});

			res.cookie("admin_refresh_token", refreshToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			// Also set standard ones for unified kernel compatibility
			res.cookie("access_token", accessToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
				maxAge: 24 * 60 * 60 * 1000,
			});

			// Return admin data only
			res.status(200).json({
				success: true,
				message: "Login successful",
				data: {
					admin: result.admin,
					// Return token for clients that prefer Bearer header
					token: accessToken,
				},
			});
		} catch (error) {
			console.error("Admin login error:", error);
			res.status(401).json({
				success: false,
				message: error instanceof Error ? error.message : "Login failed",
			});
		}
	}

	async googleLogin(req: Request, res: Response): Promise<void> {
		try {
			const { idToken } = req.body;
			if (!idToken) {
				res.status(400).json({
					success: false,
					message: "Google ID Token is required",
				});
				return;
			}

			if (!env.GOOGLE_CLIENT_ID) {
				console.error(
					"[ADMIN AUTH] Google Login aborted: GOOGLE_CLIENT_ID environment variable is not configured on backend!",
				);
				res.status(500).json({
					success: false,
					message:
						"Google authentication is misconfigured on backend (missing Client ID).",
				});
				return;
			}

			const ticket = await googleClient.verifyIdToken({
				idToken,
				audience: env.GOOGLE_CLIENT_ID,
			});
			const payload = ticket.getPayload();
			if (!payload || !payload.email) {
				res.status(401).json({
					success: false,
					message:
						"Google Identity did not yield a valid verified email claim.",
				});
				return;
			}

			const googleEmail = payload.email.toLowerCase();
			const adminEmailEnv = process.env.ADMIN_GOOGLE_EMAIL || "admin@trivenibombaybaghouse.com";
			if (googleEmail !== adminEmailEnv) {
				res.status(403).json({
					success: false,
					message:
						`Unauthorized admin email address. Only ${adminEmailEnv} is permitted via Google login.`,
				});
				return;
			}

			let admin = await prisma.admin.findUnique({
				where: { email: googleEmail },
			});

			if (!admin) {
				const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
				const dummyHash = await bcrypt.hash(
					crypto.randomBytes(24).toString("hex"),
					saltRounds,
				);
				admin = await prisma.admin.create({
					data: {
						email: googleEmail,
						name: payload.name || "BBH Admin",
						passwordHash: dummyHash,
						role: "SUPER_ADMIN",
						isActive: true,
						avatar: payload.picture || null,
					},
				});
				console.log(
					`✨ Automatically provisioned admin record for: ${googleEmail}`,
				);
			} else {
				if (!admin.isActive) {
					res.status(403).json({
						success: false,
						message: "Account is inactive. Contact super admin.",
					});
					return;
				}
				// Sync avatar if missing
				if (!admin.avatar && payload.picture) {
					admin = await prisma.admin.update({
						where: { id: admin.id },
						data: { avatar: payload.picture },
					});
				}
			}

			// Update last login
			await prisma.admin.update({
				where: { id: admin.id },
				data: { lastLoginAt: new Date() },
			});

			// Log login action
			const ipAddress =
				(req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
			const userAgent = req.headers["user-agent"];

			try {
				await adminService.logAction(admin.id, {
					action: "ADMIN_GOOGLE_LOGIN",
					details: { email: admin.email },
					ipAddress,
					userAgent,
				});
			} catch (logLog) {
				console.error("⚠️ Failed to log admin login action:", logLog);
			}

			// Generate tokens
			const adminPayload = {
				id: admin.id,
				email: admin.email,
				role: admin.role,
				type: "admin" as const,
			};

			const accessToken = jwt.sign(adminPayload, env.ADMIN_JWT_SECRET, {
				expiresIn: env.ADMIN_JWT_EXPIRES_IN as any,
			});

			const refreshToken = jwt.sign(
				{ sub: admin.id, type: "admin" },
				env.JWT_REFRESH_SECRET,
				{ expiresIn: env.JWT_REFRESH_EXPIRY as any },
			);

			const isProduction = env.NODE_ENV === "production";

			// Set cookies
			res.cookie("admin_access_token", accessToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
				maxAge: 24 * 60 * 60 * 1000,
			});

			res.cookie("admin_refresh_token", refreshToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
				maxAge: 7 * 24 * 60 * 60 * 1000,
			});

			res.cookie("access_token", accessToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
				maxAge: 24 * 60 * 60 * 1000,
			});

			res.status(200).json({
				success: true,
				message: "Google login successful",
				data: {
					admin: {
						id: admin.id,
						name: admin.name,
						email: admin.email,
						role: admin.role,
						avatar: admin.avatar,
					},
					token: accessToken,
				},
			});
		} catch (error) {
			console.error("Admin Google login error:", error);
			res.status(401).json({
				success: false,
				message: error instanceof Error ? error.message : "Google login failed",
			});
		}
	}

	async refresh(req: Request, res: Response): Promise<void> {
		try {
			const refreshToken =
				req.cookies.admin_refresh_token || req.cookies.refresh_token;

			if (!refreshToken) {
				res
					.status(401)
					.json({ success: false, message: "Refresh token required" });
				return;
			}

			const result = await authService.refreshToken(refreshToken);

			const isProduction = env.NODE_ENV === "production";

			res.cookie("admin_access_token", result.accessToken, {
				httpOnly: true,
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
				maxAge: 24 * 60 * 60 * 1000,
			});

			res.status(200).json({
				success: true,
				message: "Token refreshed",
				data: { token: result.accessToken },
			});
		} catch (error: any) {
			logger.error(`Admin refresh error: ${error.message}`);
			res
				.status(401)
				.json({ success: false, message: "Invalid refresh token" });
		}
	}

	async logout(req: Request, res: Response): Promise<void> {
		try {
			const isProduction = process.env.NODE_ENV === "production";

			res.clearCookie("admin_access_token");
			res.clearCookie("admin_refresh_token");
			res.clearCookie("access_token");
			res.clearCookie("refresh_token");

			// If device info is provided, we can also remove the FCM token association
			if (req.body.deviceId) {
				await adminService.deregisterDevice(req.auth!.id, req.body.deviceId);
			}

			res.status(200).json({
				success: true,
				message: "Logout successful",
			});
		} catch (error) {
			console.error("Logout error:", error);
			res.status(500).json({
				success: false,
				message: "Logout failed",
			});
		}
	}

	async registerDevice(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const { deviceId, fcmToken, deviceName, deviceType } = req.body;
			if (!deviceId) {
				res
					.status(400)
					.json({ success: false, message: "Device ID is required" });
				return;
			}

			await adminService.registerDevice(req.auth.id, {
				deviceId,
				fcmToken,
				deviceName,
				deviceType,
			});

			res.status(200).json({
				success: true,
				message: "Device registered successfully",
			});
		} catch (error: any) {
			logger.error(`Failed to register device: ${error.message}`);
			res
				.status(500)
				.json({ success: false, message: "Internal server error" });
		}
	}

	// ==================== Profile Management ====================

	async getProfile(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const profile = await adminService.getProfile(req.auth.id);

			res.status(200).json({
				success: true,
				data: profile,
			});
		} catch (error) {
			console.error("Get profile error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch profile",
			});
		}
	}

	async updateProfile(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const validation = adminProfileUpdateSchema.safeParse(req.body);

			if (!validation.success) {
				res.status(400).json({
					success: false,
					message: "Validation error",
					errors: validation.error.errors,
				});
				return;
			}

			const updatedProfile = await adminService.updateProfile(
				req.auth.id,
				validation.data as any,
			);

			// Log profile update
			await adminService.logAction(req.auth.id, {
				action: "PROFILE_UPDATE",
				details: validation.data,
			});

			res.status(200).json({
				success: true,
				message: "Profile updated successfully",
				data: updatedProfile,
			});
		} catch (error) {
			console.error("Update profile error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to update profile",
			});
		}
	}

	async updatePassword(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const validation = adminPasswordUpdateSchema.safeParse(req.body);

			if (!validation.success) {
				res.status(400).json({
					success: false,
					message: "Validation error",
					errors: validation.error.errors,
				});
				return;
			}

			await adminService.updatePassword(req.auth.id, validation.data as any);

			// Log password change
			await adminService.logAction(req.auth.id, {
				action: "PASSWORD_CHANGE",
			});

			res.status(200).json({
				success: true,
				message: "Password updated successfully",
			});
		} catch (error) {
			console.error("Update password error:", error);
			res.status(500).json({
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to update password",
			});
		}
	}

	// ==================== Dashboard Stats ====================

	async getDashboardStats(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const stats = await adminService.getDashboardStats();

			res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error("Get dashboard stats error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch dashboard stats",
			});
		}
	}

	async getOperationalOrders(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const tenantId = (req.tenantId as string) || "DEFAULT";
			// Fallback to direct Order table query as ReadModel sync is pending
			const orders = await prisma.order.findMany({
				where: { tenantId: tenantId === "DEFAULT" ? undefined : tenantId },
				orderBy: { createdAt: "desc" },
				take: 100,
				include: {
					user: {
						select: { name: true, email: true, phone: true },
					},
					items: {
						include: { product: true },
					},
				},
			});

			// Canonical URL Normalization (Phase 1)
			const baseUrl = env.BACKEND_URL || "http://localhost:8080";
			const normalizedOrders = orders.map((o: any) => {
				if (o.items && Array.isArray(o.items)) {
					o.items.forEach((item: any) => {
						const prod = item.product;
						if (prod) {
							if (prod.thumbnail && !prod.thumbnail.startsWith("http")) {
								prod.thumbnail = `${baseUrl}${prod.thumbnail.startsWith("/") ? "" : "/"}${prod.thumbnail}`;
							}
							if (prod.images && Array.isArray(prod.images)) {
								prod.images = prod.images.map((img: any) => {
									if (typeof img === "string" && !img.startsWith("http")) {
										return `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
									}
									return img;
								});
							}
						}
					});
				}
				return o;
			});

			res.status(200).json({
				success: true,
				data: normalizedOrders,
			});
		} catch (error: any) {
			logger.error(`Failed to fetch operational orders: ${error.message}`);
			res
				.status(500)
				.json({ success: false, message: "Internal server error" });
		}
	}

	async getChartData(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const days = Number.parseInt(req.query.days as string) || 30;
			const chartData = await adminService.getChartData(days);

			res.status(200).json({
				success: true,
				data: chartData,
			});
		} catch (error) {
			console.error("Get chart data error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch chart data",
			});
		}
	}

	async getAnalytics(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const insights = await analyticsService.getPredictiveInsights();
			const velocity = await adminService.getSurveillanceMetrics();

			res.status(200).json({
				success: true,
				data: {
					...insights,
					velocity,
				},
			});
		} catch (error) {
			console.error("Get analytics error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch predictive insights",
			});
		}
	}

	async getSurveillanceMetrics(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const metrics = await adminService.getSurveillanceMetrics();
			res.status(200).json({ success: true, data: metrics });
		} catch (error: any) {
			res.status(500).json({ success: false, message: error.message });
		}
	}

	async executeCommand(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const commandType = req.params.commandType as string;
			const result = await commandBus.execute(commandType, req.body, {
				tenantId: (req.tenantId as string) || "DEFAULT",
				actor: req.auth.email as string,
			});

			res.status(200).json({
				success: true,
				message: `Command ${commandType} executed successfully`,
				data: result,
			});
		} catch (error: any) {
			logger.error(`Command execution failed: ${error.message}`);
			res.status(400).json({
				success: false,
				message: error.message || "Command failed",
			});
		}
	}

	// ==================== User Management ====================

	async getUsers(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const page = Number.parseInt(req.query.page as string) || 1;
			const limit = Number.parseInt(req.query.limit as string) || 10;
			const search = (req.query.search as string) || "";
			const status = (req.query.status as string) || "all";

			const result = await adminService.getUsers(page, limit, search, status);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error("Get users error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch users",
			});
		}
	}

	async blockUser(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const userId = req.params.userId as string;
			const validation = blockUserSchema.safeParse(req.body);

			if (!validation.success) {
				res.status(400).json({
					success: false,
					message: "Validation error",
					errors: validation.error.errors,
				});
				return;
			}

			await adminService.blockUser(userId, validation.data.reason, req.auth.id);

			// Log user block action
			await adminService.logAction(req.auth.id, {
				action: "USER_BLOCKED",
				details: { userId, reason: validation.data.reason },
			});

			res.status(200).json({
				success: true,
				message: "User blocked successfully",
			});
		} catch (error) {
			console.error("Block user error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to block user",
			});
		}
	}

	async unblockUser(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const userId = req.params.userId as string;

			await adminService.unblockUser(userId);

			// Log user unblock action
			await adminService.logAction(req.auth.id, {
				action: "USER_UNBLOCKED",
				details: { userId },
			});

			res.status(200).json({
				success: true,
				message: "User unblocked successfully",
			});
		} catch (error) {
			console.error("Unblock user error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to unblock user",
			});
		}
	}

	// ==================== Order Management ====================

	async getOrders(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const page = Number.parseInt(req.query.page as string) || 1;
			const limit = Number.parseInt(req.query.limit as string) || 10;
			const status = (req.query.status as string) || "all";
			const search = (req.query.search as string) || "";

			const result = await adminService.getOrders(page, limit, status, search);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error("Get orders error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch orders",
			});
		}
	}

	async updateOrderStatus(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const orderId = req.params.orderId as string;
			const validation = updateOrderStatusSchema.safeParse(req.body);

			if (!validation.success) {
				res.status(400).json({
					success: false,
					message: "Validation error",
					errors: validation.error.errors,
				});
				return;
			}

			await adminService.updateOrderStatus(
				orderId,
				validation.data.status,
				validation.data.notes,
			);

			// Log order status update
			await adminService.logAction(req.auth.id, {
				action: "ORDER_STATUS_UPDATE",
				details: { orderId, ...validation.data },
			});

			res.status(200).json({
				success: true,
				message: "Order status updated successfully",
			});
		} catch (error) {
			console.error("Update order status error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to update order status",
			});
		}
	}

	async updateOrderDetails(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const orderId = req.params.orderId as string;
			const { trackingNumber, adminNotes, estimatedDelivery } = req.body;

			const result = await adminService.updateOrderDetails(orderId, {
				trackingNumber,
				adminNotes,
				estimatedDelivery,
			});

			// Log action
			await adminService.logAction(req.auth.id, {
				action: "ORDER_DETAILS_UPDATE",
				details: { orderId, hasTracking: !!trackingNumber },
			});

			res.status(200).json({
				success: true,
				message: "Order details updated successfully",
				data: result,
			});
		} catch (error: any) {
			console.error("Update order details error:", error);
			res.status(500).json({
				success: false,
				message: error.message || "Failed to update order details",
			});
		}
	}

	// ==================== Product Management ====================

	async getProducts(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const page = Number.parseInt(req.query.page as string) || 1;
			const limit = Number.parseInt(req.query.limit as string) || 10;
			const category = (req.query.category as string) || "all";
			const search = (req.query.search as string) || "";

			const result = await adminService.getProducts(
				page,
				limit,
				category,
				search,
			);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error("Get products error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch products",
			});
		}
	}

	async createProduct(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const validation = createProductSchema.safeParse(req.body);

			if (!validation.success) {
				res.status(400).json({
					success: false,
					message: "Validation error",
					errors: validation.error.errors,
				});
				return;
			}

			const product = await adminService.createProduct(validation.data);

			// Log product creation
			await adminService.logAction(req.auth.id, {
				action: "PRODUCT_CREATE",
				details: { productId: product.id, name: product.name },
			});

			res.status(201).json({
				success: true,
				message: "Product created successfully",
				data: product,
			});
		} catch (error: any) {
			console.error("Create product error:", error);
			res.status(400).json({
				success: false,
				message: error.message || "Failed to create product",
			});
		}
	}

	async updateProduct(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					errorCode: "UNAUTHORIZED",
					message: "Unauthorized",
				});
				return;
			}

			const { productId } = req.params;

			// Log incoming request in development for diagnostics
			if (process.env.NODE_ENV !== "production") {
				console.log(`[PRODUCT_UPDATE] PUT /admin/products/${productId}`);
				console.log(`[PRODUCT_UPDATE] Request body:`, JSON.stringify(req.body, null, 2));
			}

			const validation = updateProductSchema.safeParse(req.body);

			if (!validation.success) {
				const fieldErrors = validation.error.errors.map((e) => ({
					field: e.path.join("."),
					message: e.message,
					code: e.code,
				}));
				console.error(
					`[PRODUCT_UPDATE] ❌ Validation failed for product ${productId}:`,
					JSON.stringify(fieldErrors, null, 2),
				);
				res.status(400).json({
					success: false,
					errorCode: "VALIDATION_FAILED",
					message: "Request payload failed schema validation",
					fields: fieldErrors,
					details: `${fieldErrors.length} field(s) failed validation: ${fieldErrors.map((f) => f.field).join(", ")}`
				});
				return;
			}

			// Sanitize: remove undefined fields so Prisma doesn't attempt to set them
			const sanitizedData: Record<string, any> = {};
			for (const [key, value] of Object.entries(validation.data)) {
				if (value !== undefined) {
					sanitizedData[key] = value;
				}
			}

			// Ensure images array never contains null/empty-string values
			if (Array.isArray(sanitizedData.images)) {
				sanitizedData.images = sanitizedData.images.filter(
					(img: any) => typeof img === "string" && img.trim() !== ""
				);
			}

			if (process.env.NODE_ENV !== "production") {
				console.log(
					`[PRODUCT_UPDATE] ✅ Validated & sanitized payload for product ${productId}:`,
					JSON.stringify(sanitizedData, null, 2),
				);
			}

			await adminService.updateProduct(productId as string, sanitizedData);

			// Log product update
			await adminService.logAction(req.auth.id, {
				action: "PRODUCT_UPDATE",
				details: {
					productId,
					updatedFields: Object.keys(sanitizedData),
					imageCount: Array.isArray(sanitizedData.images) ? sanitizedData.images.length : undefined,
				},
			});

			res.status(200).json({
				success: true,
				message: "Product updated successfully",
				data: { productId, updatedFields: Object.keys(sanitizedData) },
			});
		} catch (error: any) {
			console.error(`[PRODUCT_UPDATE] ❌ Update failed for product ${req.params.productId}:`, {
				message: error.message,
				code: error.code,
				meta: error.meta,
			});
			// Return structured error with Prisma error details if available
			res.status(500).json({
				success: false,
				errorCode: "UPDATE_FAILED",
				message: error.message || "Failed to update product",
				details: error.code ? `Database error: ${error.code} ${error.meta ? JSON.stringify(error.meta) : ""}` : undefined,
			});
		}
	}

	async deleteProduct(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const { productId } = req.params;

			await adminService.deleteProduct(productId as string);

			// Log product deletion
			await adminService.logAction(req.auth.id, {
				action: "PRODUCT_DELETE",
				details: { productId },
			});

			res.status(200).json({
				success: true,
				message: "Product deleted successfully",
			});
		} catch (error) {
			console.error("Delete product error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to delete product",
			});
		}
	}

	async duplicateProduct(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}
			const { productId } = req.params;
			const product = await adminService.duplicateProduct(productId as string);
			await adminService.logAction(req.auth.id, {
				action: "PRODUCT_DUPLICATE",
				details: { productId, newProductId: product.id },
			});
			res.status(201).json({
				success: true,
				message: "Product duplicated successfully",
				data: product,
			});
		} catch (error: any) {
			console.error("Duplicate product error:", error);
			res.status(500).json({ success: false, message: error.message || "Failed to duplicate product" });
		}
	}

	async archiveProduct(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}
			const { productId } = req.params;
			const product = await adminService.archiveProduct(productId as string);
			await adminService.logAction(req.auth.id, {
				action: "PRODUCT_ARCHIVE",
				details: { productId, newStatus: product.status },
			});
			res.status(200).json({
				success: true,
				message: `Product status updated to ${product.status}`,
				data: product,
			});
		} catch (error: any) {
			console.error("Archive product error:", error);
			res.status(500).json({ success: false, message: error.message || "Failed to archive product" });
		}
	}

	async updateStock(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}
			const { productId } = req.params;
			const { stock } = req.body;
			if (typeof stock !== "number" || stock < 0) {
				res.status(400).json({ success: false, message: "Valid non-negative stock quantity required" });
				return;
			}
			const product = await adminService.updateStock(productId as string, stock);
			await adminService.logAction(req.auth.id, {
				action: "PRODUCT_STOCK_UPDATE",
				details: { productId, stock },
			});
			res.status(200).json({
				success: true,
				message: "Stock updated successfully",
				data: product,
			});
		} catch (error: any) {
			console.error("Update stock error:", error);
			res.status(500).json({ success: false, message: error.message || "Failed to update stock" });
		}
	}

	// ==================== Activity Logs ====================

	async getActivityLogs(req: Request, res: Response): Promise<void> {
		try {
			if (!req.auth) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const page = Number.parseInt(req.query.page as string) || 1;
			const limit = Number.parseInt(req.query.limit as string) || 20;

			const result = await adminService.getAdminLogs(req.auth.id, page, limit);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error("Get activity logs error:", error);
			res.status(500).json({
				success: false,
				message: "Failed to fetch activity logs",
			});
		}
	}

	async getBusinessConfig(req: Request, res: Response): Promise<void> {
		try {
			const config = await adminService.getBusinessConfig(
				(req.tenantId as string) || "DEFAULT",
			);
			res.status(200).json({ success: true, data: config });
		} catch (error: any) {
			res.status(500).json({ success: false, message: error.message });
		}
	}

	async updateBusinessConfig(req: Request, res: Response): Promise<void> {
		try {
			const config = await adminService.updateBusinessConfig(
				(req.tenantId as string) || "DEFAULT",
				req.body,
			);
			res.status(200).json({ success: true, data: config });
		} catch (error: any) {
			res.status(500).json({ success: false, message: error.message });
		}
	}
}

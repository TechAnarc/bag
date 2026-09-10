import { type Prisma, ProductStatus } from "@prisma/client";
import { slugify } from "../../utils/slugify";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type {
	AdminLoginDto,
	AdminJwtPayload,
	AdminProfileUpdateDto,
	AdminPasswordUpdateDto,
	DashboardStats,
	ChartData,
	AdminLogDto,
} from "./admin.types";

// Using shared prisma instance from config

export class AdminService {
	// ==================== Authentication ====================

	async login(loginDto: AdminLoginDto): Promise<{
		token: string;
		admin: {
			id: string;
			name: string;
			email: string;
			role: string;
			avatar: string | null;
		};
	}> {
		const { email, password } = loginDto;

		// Find admin by email
		const admin = await prisma.admin.findUnique({
			where: { email },
		});

		if (!admin) {
			throw new Error("Invalid credentials");
		}

		if (!admin.isActive) {
			throw new Error("Account is inactive. Contact super admin.");
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
		if (!isValidPassword) {
			console.warn(`❌ Admin login failed: Invalid password for ${email}`);
			throw new Error("Invalid credentials");
		}

		// Update last login
		await prisma.admin.update({
			where: { id: admin.id },
			data: { lastLoginAt: new Date() },
		});

		// Generate JWT token
		const payload: AdminJwtPayload = {
			id: admin.id,
			email: admin.email,
			role: admin.role,
			type: "admin",
		};

		const secret = env.ADMIN_JWT_SECRET;
		const token = jwt.sign(payload, secret, {
			expiresIn: env.ADMIN_JWT_EXPIRES_IN as any,
		});

		return {
			token,
			admin: {
				id: admin.id,
				name: admin.name,
				email: admin.email,
				role: admin.role,
				avatar: admin.avatar,
			},
		};
	}

	// ==================== Profile Management ====================

	async getProfile(adminId: string) {
		const admin = await prisma.admin.findUnique({
			where: { id: adminId },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				avatar: true,
				role: true,
				isActive: true,
				lastLoginAt: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!admin) {
			throw new Error("Admin not found");
		}

		return admin;
	}

	async updateProfile(
		adminId: string,
		updateDto: AdminProfileUpdateDto,
	): Promise<any> {
		const admin = await prisma.admin.update({
			where: { id: adminId },
			data: updateDto,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				avatar: true,
				role: true,
				isActive: true,
				lastLoginAt: true,
			},
		});

		return admin;
	}

	async updatePassword(
		adminId: string,
		passwordDto: AdminPasswordUpdateDto,
	): Promise<void> {
		const admin = await prisma.admin.findUnique({
			where: { id: adminId },
		});

		if (!admin) {
			throw new Error("Admin not found");
		}

		// Verify current password
		const isValid = await bcrypt.compare(
			passwordDto.currentPassword,
			admin.passwordHash,
		);
		if (!isValid) {
			throw new Error("Current password is incorrect");
		}

		// Hash new password
		const saltRounds = env.BCRYPT_SALT_ROUNDS;
		const newPasswordHash = await bcrypt.hash(
			passwordDto.newPassword,
			saltRounds,
		);

		// Update password
		await prisma.admin.update({
			where: { id: adminId },
			data: { passwordHash: newPasswordHash },
		});
	}

	// ==================== Dashboard Stats ====================

	async getDashboardStats(): Promise<DashboardStats> {
		const now = new Date();
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		// Run all queries in parallel
		const [
			totalUsers,
			totalOrders,
			totalProducts,
			outOfStockProducts,
			recentUsers,
			completedOrders,
			recentOrders,
		] = await Promise.all([
			prisma.user.count({ where: { isBlocked: false } }),
			prisma.order.count(),
			prisma.product.count({ where: { isActive: true } }),
			// Compute out-of-stock products from JSON-backed inventory
			(async () => {
				const activeProducts = await prisma.product.findMany({
					where: { isActive: true },
					select: { inventory: true },
				});

				return activeProducts.filter((p: any) => {
					const inv = (p as any).inventory || {};
					const quantity =
						typeof inv.quantity === "number" ? inv.quantity : null;
					const inStock =
						typeof inv.inStock === "boolean"
							? inv.inStock
							: quantity !== null
								? quantity > 0
								: true;

					return !inStock || quantity === 0;
				}).length;
			})(),
			prisma.user.count({
				where: {
					createdAt: { gte: sevenDaysAgo },
				},
			}),
			prisma.order.findMany({
				where: {
					status: "DELIVERED",
					paymentStatus: "COMPLETED",
				},
				select: { total: true },
			}),
			prisma.order.findMany({
				where: {
					createdAt: { gte: sevenDaysAgo },
					paymentStatus: "COMPLETED",
				},
				select: { total: true },
			}),
		]);

		const totalRevenue = completedOrders.reduce(
			(acc: number, order: any) => acc + (order.total || 0),
			0,
		);
		const recentRevenue = recentOrders.reduce(
			(acc: number, order: any) => acc + (order.total || 0),
			0,
		);

		// Manually query pending orders since it was missing from the parallel block
		const pendingOrders = await prisma.order.count({
			where: { status: "PENDING" },
		});

		// 🧠 UPIS: Aggregate Intelligence Stats
		const upisAggregation = await (prisma as any).userIntelligence.groupBy({
			by: ["lifecycleStage"],
			_count: true,
			_avg: {
				conversionScore: true,
			},
		});

		const upisStats = {
			highValue:
				upisAggregation.find((a: any) => a.lifecycleStage === "HIGH_VALUE")
					?._count || 0,
			atRisk:
				upisAggregation.find((a: any) => a.lifecycleStage === "AT_RISK")
					?._count || 0,
			loyal:
				upisAggregation.find((a: any) => a.lifecycleStage === "LOYAL")
					?._count || 0,
			avgConversion:
				upisAggregation.reduce(
					(acc: number, curr: any) => acc + (curr._avg.conversionScore || 0),
					0,
				) / (upisAggregation.length || 1),
			churnAlerts:
				upisAggregation.find((a: any) => a.lifecycleStage === "AT_RISK")
					?._count || 0,
			fraudSignals: 0,
		};

		return {
			totalUsers,
			totalOrders,
			totalProducts,
			totalRevenue,
			pendingOrders,
			outOfStockProducts,
			recentUsers,
			recentRevenue,
			upisStats,
		};
	}

	// ==================== Chart Data ====================

	async getChartData(days = 30): Promise<ChartData> {
		const now = new Date();
		const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

		// Orders chart data
		const orders = await prisma.order.groupBy({
			by: ["createdAt"],
			where: {
				createdAt: { gte: startDate },
			},
			_count: true,
		});

		// Group by date
		const ordersMap = new Map<string, number>();
		for (const order of orders) {
			const date = order.createdAt.toISOString().split("T")[0];
			ordersMap.set(date, (ordersMap.get(date) || 0) + order._count);
		}

		const ordersChart = Array.from(ordersMap.entries())
			.map(([date, orders]) => ({ date, orders }))
			.sort((a, b) => a.date.localeCompare(b.date));

		// Revenue chart data
		const revenueData = await prisma.order.findMany({
			where: {
				createdAt: { gte: startDate },
				paymentStatus: "COMPLETED",
			},
			select: {
				createdAt: true,
				total: true,
			},
		});

		const revenueMap = new Map<string, number>();
		for (const item of revenueData) {
			const date = item.createdAt.toISOString().split("T")[0];
			revenueMap.set(date, (revenueMap.get(date) || 0) + item.total);
		}

		const revenueChart = Array.from(revenueMap.entries())
			.map(([date, revenue]) => ({ date, revenue }))
			.sort((a, b) => a.date.localeCompare(b.date));

		// Category distribution
		const categories = await (prisma.category as any).findMany({
			include: {
				_count: {
					select: { products: true },
				},
				products: {
					select: { price: true },
				},
			},
		});

		const categoryChart = categories.map((cat: any) => ({
			category: cat.name,
			count: cat._count?.products || 0,
			value:
				cat.products?.reduce(
					(sum: number, p: any) => sum + (p.price || 0),
					0,
				) || 0,
		}));

		return {
			ordersChart,
			revenueChart,
			categoryChart,
		};
	}

	// ==================== User Management ====================

	async getUsers(page = 1, limit = 10, search = "", status = "all") {
		const skip = (page - 1) * limit;

		const where: Prisma.UserWhereInput = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
				{ phone: { contains: search, mode: "insensitive" } },
			];
		}

		if (status === "blocked") {
			where.isBlocked = true;
		} else if (status === "active") {
			where.isBlocked = false;
		}

		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				skip,
				take: limit,
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					avatar: true,
					role: true,
					isBlocked: true,
					blockedReason: true,
					lastLoginAt: true,
					loginCount: true,
					createdAt: true,
					_count: {
						select: {
							orders: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
			}),
			prisma.user.count({ where }),
		]);

		return {
			users,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async blockUser(
		userId: string,
		reason: string,
		adminId: string,
	): Promise<void> {
		await prisma.user.update({
			where: { id: userId },
			data: {
				isBlocked: true,
				blockedReason: reason,
			},
		});
	}

	async unblockUser(userId: string): Promise<void> {
		await prisma.user.update({
			where: { id: userId },
			data: {
				isBlocked: false,
				blockedReason: null,
			},
		});
	}

	// ==================== Order Management ====================

	async getOrders(page = 1, limit = 10, status = "all", search = "") {
		const skip = (page - 1) * limit;

		const where: Prisma.OrderWhereInput = {};

		if (status !== "all") {
			where.status = status as any;
		}

		if (search) {
			where.OR = [
				{ orderNumber: { contains: search, mode: "insensitive" } },
				{ user: { name: { contains: search, mode: "insensitive" } } },
				{ user: { email: { contains: search, mode: "insensitive" } } },
			];
		}

		const [orders, total] = await Promise.all([
			prisma.order.findMany({
				where,
				skip,
				take: limit,
				select: {
					id: true,
					orderNumber: true,
					status: true,
					paymentStatus: true,
					paymentMethod: true,
					subtotal: true,
					total: true,
					createdAt: true,
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					items: {
						select: {
							id: true,
							quantity: true,
							price: true,
							product: {
								select: {
									name: true,
									thumbnail: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: "desc" },
			}),
			prisma.order.count({ where }),
		]);

		// Canonical URL Normalization (Phase 1)
		const baseUrl = env.BACKEND_URL || "http://localhost:8080";
		const normalizedOrders = orders.map((o: any) => {
			if (o.items && Array.isArray(o.items)) {
				o.items.forEach((i: any) => {
					if (i.product?.thumbnail && !i.product.thumbnail.startsWith("http")) {
						i.product.thumbnail = `${baseUrl}${i.product.thumbnail.startsWith("/") ? "" : "/"}${i.product.thumbnail}`;
					}
				});
			}
			return o;
		});

		return {
			orders: normalizedOrders,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async updateOrderStatus(
		orderId: string,
		status: string,
		notes?: string,
	): Promise<void> {
		const {
			fulfillmentOrchestrator,
		} = require("../logistics/fulfillment-orchestrator.service");
		await fulfillmentOrchestrator.orchestrateFulfillmentTransition(
			orderId,
			status as any,
			{
				actor: "ADMIN_CONSOLE",
				notes: notes || `Status explicitly overridden by administrator.`,
			},
		);
	}

	async updateOrderDetails(
		orderId: string,
		data: {
			trackingNumber?: string;
			adminNotes?: string;
			estimatedDelivery?: Date | string;
		},
	): Promise<any> {
		return prisma.order.update({
			where: { id: orderId },
			data: {
				trackingNumber: data.trackingNumber,
				adminNotes: data.adminNotes,
				estimatedDelivery: data.estimatedDelivery
					? new Date(data.estimatedDelivery)
					: undefined,
			},
		});
	}

	// ==================== Product Management ====================

	async getProducts(page = 1, limit = 10, category = "all", search = "") {
		const skip = (page - 1) * limit;

		const where: Prisma.ProductWhereInput = { isActive: true };

		if (category !== "all") {
			(where as any).categoryId = category;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{
					category: { is: { name: { contains: search, mode: "insensitive" } } },
				} as any,
				{ sku: { contains: search, mode: "insensitive" } },
			];
		}

		const [products, total] = await Promise.all([
			prisma.product.findMany({
				where,
				skip,
				take: limit,
				select: {
					id: true,
					name: true,
					slug: true,
					category: {
						select: { name: true },
					},
					price: true,
					discountPrice: true,
					inventory: true,
					thumbnail: true,
					isActive: true,
					isFeatured: true,
					isTrending: true,
					views: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
			}),
			prisma.product.count({ where }),
		]);

		return {
			products,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async updateProduct(productId: string, updateData: any): Promise<void> {
		// Explicitly map only Prisma-compatible Product fields to avoid unknown field errors
		const ALLOWED_PRODUCT_FIELDS = new Set([
			"name", "categoryId", "description", "shortTagline", "platingType",
			"price", "basePrice", "sellingPrice", "ownerPrice", "discountPrice",
			"images", "thumbnail", "specifications", "inventory", "seo",
			"isActive", "isFeatured", "isTrending", "status",
			"tags", "badges", "careInstructions",
		]);

		const prismaData: Record<string, any> = {};
		for (const [key, value] of Object.entries(updateData)) {
			if (ALLOWED_PRODUCT_FIELDS.has(key) && value !== undefined) {
				prismaData[key] = value;
			} else if (!ALLOWED_PRODUCT_FIELDS.has(key)) {
				console.warn(
					`[PRODUCT_UPDATE_SERVICE] Skipping non-Product field: "${key}" — not in Prisma schema`,
				);
			}
		}

		if (Object.keys(prismaData).length === 0) {
			console.warn(
				`[PRODUCT_UPDATE_SERVICE] No valid fields to update for product ${productId}`,
			);
			return;
		}

		// If status is set, also sync isActive for consistency
		if (prismaData.status === "ACTIVE") prismaData.isActive = true;
		if (prismaData.status === "INACTIVE") prismaData.isActive = false;

		await prisma.product.update({
			where: { id: productId },
			data: prismaData,
		});

		console.log(
			`[PRODUCT_UPDATE_SERVICE] ✅ Product ${productId} updated with fields: ${Object.keys(prismaData).join(", ")}`,
		);
	}

	async deleteProduct(productId: string): Promise<void> {
		try {
			// 1. Attempt hard delete first
			await prisma.product.delete({
				where: { id: productId },
			});
			console.log(`[ADMIN] ✅ Product ${productId} hard-deleted successfully.`);
		} catch (error: any) {
			// 2. If it has orders, falling back to soft delete is mandatory for data integrity
			if (error.code === "P2003") {
				console.log(
					`[ADMIN] ℹ️ Product ${productId} has dependencies (orders). Falling back to soft-delete.`,
				);
				await prisma.product.update({
					where: { id: productId },
					data: { isActive: false },
				});
			} else {
				throw error;
			}
		}
	}

	async createProduct(data: any): Promise<any> {
		const slug = slugify(data.name);

		// Check for existing slug
		const existing = await prisma.product.findUnique({
			where: { slug },
		});

		let finalSlug = slug;
		if (existing) {
			finalSlug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
		}

		const existingSku = await prisma.product.findUnique({
			where: { sku: data.sku },
		});

		if (existingSku) {
			throw new Error("Product with this SKU already exists");
		}

		return prisma.product.create({
			data: {
				...data,
				slug: finalSlug,
				isActive: true,
			},
		});
	}

	// ==================== Admin Logging ====================

	async logAction(adminId: string, logDto: AdminLogDto): Promise<void> {
		await prisma.adminLog.create({
			data: {
				adminId,
				action: logDto.action,
				details: logDto.details || {},
				ipAddress: logDto.ipAddress,
				userAgent: logDto.userAgent,
			},
		});
	}

	async getAdminLogs(adminId: string, page = 1, limit = 20) {
		const skip = (page - 1) * limit;

		const [logs, total] = await Promise.all([
			prisma.adminLog.findMany({
				where: { adminId },
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					action: true,
					details: true,
					ipAddress: true,
					createdAt: true,
				},
			}),
			prisma.adminLog.count({ where: { adminId } }),
		]);

		return {
			logs,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	/**
	 * TRIVENI-OS-1: Global Order Surveillance Metrics
	 */
	async getSurveillanceMetrics() {
		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const [recentOrders, failedPayments, escalatedOrders, totalRevenueToday] =
			await Promise.all([
				prisma.order.count({ where: { createdAt: { gte: oneHourAgo } } }),
				prisma.order.count({
					where: { paymentStatus: "FAILED", createdAt: { gte: today } },
				}),
				prisma.order.count({ where: { isEscalated: true } }),
				prisma.order.aggregate({
					where: { createdAt: { gte: today }, paymentStatus: "COMPLETED" },
					_sum: { total: true },
				}),
			]);

		// Velocity Calculation
		const velocity = recentOrders / 60; // orders per minute
		const nodeStability =
			failedPayments > 10 ? 0.75 : failedPayments > 5 ? 0.85 : 0.99;

		return {
			velocity: parseFloat(velocity.toFixed(4)),
			stability: nodeStability,
			activeStreams: recentOrders,
			escalations: escalatedOrders,
			revenueToday: totalRevenueToday._sum.total || 0,
			timestamp: now.toISOString(),
		};
	}

	// ==================== Business Config ====================

	async getBusinessConfig(tenantId: string = "DEFAULT") {
		return (prisma as any).businessConfig.findUnique({
			where: { tenantId },
		});
	}

	async updateBusinessConfig(tenantId: string = "DEFAULT", data: any) {
		return (prisma as any).businessConfig.upsert({
			where: { tenantId },
			update: data,
			create: { ...data, tenantId },
		});
	}

	// ==================== Mobile & Notifications ====================

	async registerDevice(
		adminId: string,
		data: {
			deviceId: string;
			fcmToken?: string;
			deviceName?: string;
			deviceType?: string;
		},
	) {
		// 1. Upsert device record
		await prisma.adminDevice.upsert({
			where: { deviceId: data.deviceId },
			update: {
				adminId,
				fcmToken: data.fcmToken,
				deviceName: data.deviceName,
				deviceType: data.deviceType,
				lastUsedAt: new Date(),
			},
			create: {
				adminId,
				deviceId: data.deviceId,
				fcmToken: data.fcmToken,
				deviceName: data.deviceName,
				deviceType: data.deviceType,
			},
		});

		// 2. Also update primary fcmToken for backward compatibility
		if (data.fcmToken) {
			await prisma.admin.update({
				where: { id: adminId },
				data: { fcmToken: data.fcmToken },
			});
		}
	}

	async deregisterDevice(adminId: string, deviceId: string) {
		await prisma.adminDevice.deleteMany({
			where: {
				adminId,
				deviceId,
			},
		});
	}
}

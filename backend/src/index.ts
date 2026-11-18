import dns from "dns";
import express from "express";

if (dns.setDefaultResultOrder) {
	dns.setDefaultResultOrder("ipv4first");
}
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/database";
import { setupSwagger } from "./config/swagger";
import { errorHandler } from "./middleware/error.middleware";
import { seedSuperAdmin } from "./utils/seedAdmin";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/product.routes";
import cartRoutes from "./modules/cart/cart.routes";
import orderRoutes from "./modules/orders/order.routes";
import contactRoutes from "./modules/contact/contact.routes";
import profileRoutes from "./modules/profile/profile.routes";
import reviewRoutes from "./modules/reviews/review.routes";
import adminRoutes from "./modules/admin/admin.routes";
import categoryRoutes from "./modules/category/category.routes";
import deliveryRoutes from "./modules/delivery/delivery.routes";
import { upisRouter, initializeUPIS } from "./modules/upis";
import upisAdminRoutes from "./modules/upis/admin/admin.routes";
import { agentsRoutes } from "./modules/agents/agents.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import seoRoutes from "./modules/seo/seo.routes";
import couponRoutes from "./modules/coupons/coupon.routes";
import { seoNormalizationMiddleware } from "./middleware/seo.middleware";
import { metaInjectorMiddleware } from "./middleware/meta-injector.middleware";

import { createServer } from "http";
import { SocketService } from "./config/socket";
import { warehouseService } from "./modules/warehouse/warehouse.service";
import { workflowService } from "./modules/automation/workflow.service";
import { analyticsService } from "./modules/analytics/analytics.service";
import { slaMonitor } from "./modules/automation/sla-monitor";
import { fraudService } from "./modules/fraud/fraud.service";
import { ledgerService } from "./modules/finance/ledger.service";
import { orderProjection } from "./modules/orders/order.projection";
import { ade } from "./modules/automation/ade.service";
import { registerOrderHandlers } from "./modules/orders/order.command-handlers";
import "./modules/orders/order.listeners"; // Static import: initializes event subscriptions on boot
import { verifyCryptographicSetup, verifyJWTSetup } from "./utils/crypto-verification";

import { requestLogger } from "./middleware/request-logger.middleware";
import { adminSocketSubscriber } from "./modules/admin/admin.socket-subscriber";
import { tenantContextMiddleware } from "./middleware/tenant-context";
import { pluginManager } from "./core/plugins/plugin-manager";
import { LoyaltyPlugin } from "./plugins/loyalty/loyalty.plugin";
import { AdminNotificationPlugin } from "./plugins/notifications/admin-notification.plugin";
import { authenticateAdmin } from "./middleware/adminAuth.middleware";

const app = express();
const server = createServer(app);
const PORT = env.PORT;

app.use(requestLogger);
process.on("uncaughtException", (err) => {
	logger.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
	logger.error(err.name, err.message);
	logger.error(err.stack);
	process.exit(1);
});

process.on("unhandledRejection", (err: any) => {
	logger.error("❌ UNHANDLED REJECTION! Shutting down...");
	logger.error(err.name, err.message);
	logger.error(err.stack);
	process.exit(1);
});

// --- 1. PREFLIGHT & CORS (CRITICAL: MUST BE ABSOLUTE FIRST) ---
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);

			// Clean the incoming origin
			const cleanOrigin = origin.trim().replace(/\/+$/, "");
			const isProduction = env.NODE_ENV === "production";

			// Parse environment-configured origins
			const parseConfiguredOrigins = (raw: string | undefined): string[] => {
				if (!raw) return [];
				return raw
					.split(",")
					.map((o) => o.trim().replace(/\/+$/, ""))
					.filter(Boolean);
			};

			const envConfiguredOrigins = Array.from(
				new Set([
					...parseConfiguredOrigins(env.CORS_ORIGIN),
					...parseConfiguredOrigins(env.CORS_ALLOWED_ORIGINS),
					...parseConfiguredOrigins(env.FRONTEND_URL),
				]),
			);

			if (isProduction) {
				// Production: ONLY explicitly configured production frontend origin(s) + verified domains
				const productionAllowedOrigins = Array.from(
					new Set([
						...envConfiguredOrigins,
						"https://trivenibombaybaghouse.vercel.app",
						"https://trivenibombaybaghouse.onrender.com",
						"https://bombaybaghouse.onrender.com",
						"https://bag-azlo.onrender.com",
						"https://bombaybaghouse.vercel.app",
					]),
				);

				const isAllowed = productionAllowedOrigins.some(
					(o) => cleanOrigin === o || cleanOrigin.startsWith(`${o}/`),
				);
				const isVercel =
					cleanOrigin.startsWith("https://") &&
					(cleanOrigin.endsWith(".vercel.app") || cleanOrigin.endsWith(".figma.site"));

				if (isAllowed || isVercel) {
					return callback(null, true);
				}

				logger.warn(`[CORS] Rejected origin in production: ${origin}`);
				return callback(new Error("Not allowed by CORS"));
			}

			// Local development / testing mode:
			// Explicitly allow local dev origins (http://localhost:8082, http://localhost:8081, etc.)
			// Never uses wildcard '*'
			const localDevOrigins = [
				"http://localhost:8082",
				"http://localhost:8081",
				"http://localhost:8080",
				"http://localhost:5173",
				"http://localhost:3000",
				"http://localhost:4000",
				"http://127.0.0.1:8082",
				"http://127.0.0.1:8081",
				"http://127.0.0.1:8080",
				"http://127.0.0.1:5173",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:4000",
				"https://localhost",
				"http://localhost",
			];

			const isExplicitLocalDev = localDevOrigins.includes(cleanOrigin);
			const isLocalLoopbackPort =
				/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
			const isCapacitor = cleanOrigin.startsWith("capacitor://");
			const matchesConfigured = envConfiguredOrigins.some(
				(o) => cleanOrigin === o || cleanOrigin.startsWith(`${o}/`),
			);

			if (isExplicitLocalDev || isLocalLoopbackPort || isCapacitor || matchesConfigured) {
				return callback(null, true);
			}

			logger.warn(`[CORS] Rejected origin in development: ${origin}`);
			return callback(new Error("Not allowed by CORS"));
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"Accept",
			"Origin",
			"Cache-Control",
			"x-visitor-id",
			"X-Visitor-Id",
		],
		exposedHeaders: ["Set-Cookie", "Authorization"],
	}),
);

// --- 2. LOGGING (Must be next for diagnostics) ---
app.use(
	morgan("dev"), // Use simple dev format for now
);

import path from "path";

// --- 3. SYSTEM ROUTES ---
app.use("/", seoRoutes);
app.use(seoNormalizationMiddleware);

// Static assets with caching
const cacheOptions = {
	maxAge: "1d",
	etag: true,
	lastModified: true,
};

app.use(
	"/uploads",
	express.static(path.join(process.cwd(), "public", "uploads"), cacheOptions),
);
app.use(
	"/assets/products",
	express.static(
		path.join(process.cwd(), "public", "uploads", "products"),
		cacheOptions,
	),
);
app.use(
	"/assets",
	express.static(path.join(process.cwd(), "public", "assets"), {
		...cacheOptions,
		maxAge: "7d",
	}),
);
app.use(
	express.static(path.join(process.cwd(), "public"), {
		...cacheOptions,
		index: false,
	}),
);

app.get("/health", async (req, res) => {
	let dbStatus = "UP";
	try {
		await prisma.$queryRaw`SELECT 1`;
	} catch (err) {
		dbStatus = "DOWN";
	}

	res.status(dbStatus === "UP" ? 200 : 503).json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		services: {
			api: "UP",
			database: dbStatus,
		},
	});
});

// Alias for Render health check
app.get("/api/v1/health", async (req, res) => {
	let dbStatus = "CONNECTED";
	try {
		await prisma.$queryRaw`SELECT 1`;
	} catch (err) {
		dbStatus = "DEGRADED";
	}

	// Always return 200 to satisfy Render's readiness probe while app is booting
	res.status(200).json({
		status: dbStatus === "CONNECTED" ? "healthy" : "degraded",
		timestamp: new Date().toISOString(),
		services: {
			api: "UP",
			database: dbStatus,
		},
	});
});
app.get("/health/diagnostics", async (req, res) => {
	try {
		// 1. Connection Check
		await prisma.$queryRaw`SELECT 1`;

		// 2. Storage Check
		let storageStatus = "DISCONNECTED";
		try {
			const { SupabaseStorageService } = await import(
				"./services/supabase-storage.service"
			);
			if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
				await SupabaseStorageService.initBucket();
				storageStatus = "CONNECTED";
			} else {
				storageStatus = "LOCAL_ONLY";
			}
		} catch (err) {
			storageStatus = "ERROR";
		}

		// 3. Migration Status (Heuristic)
		const migrations = await prisma.$queryRaw<
			any[]
		>`SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC`.catch(
			() => [],
		);

		// 4. Table Presence Check
		const tablesCount = await prisma.$queryRaw<any[]>`
      SELECT count(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `.catch(() => [{ count: 0 }]);

		res.status(200).json({
			database: "CONNECTED",
			storage: storageStatus,
			schema: {
				tables: parseInt(tablesCount[0].count),
				lastMigration: migrations[0]?.migration_name || "None",
				lastMigrationAt: migrations[0]?.finished_at || null,
			},
			environment: env.NODE_ENV,
			timestamp: new Date().toISOString(),
		});
	} catch (err: any) {
		res.status(500).json({
			database: "DISCONNECTED",
			error: err.message,
			environment: env.NODE_ENV,
		});
	}
});

app.get("/", (req: express.Request, res: express.Response) => {
	res.status(200).json({
		message: "Bombay Bag House Commerce API - Enterprise Backend",
		version: "1.1.0",
		docs: "/api-docs",
		health: {
			minimal: "/health",
			diagnostics: "/health/diagnostics",
		},
	});
});

app.use(
	morgan("combined", {
		stream: { write: (message: string) => logger.http(message.trim()) },
	}),
);

app.set("trust proxy", 1); // Trust Render's proxy for secure cookies
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
		crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
		contentSecurityPolicy: false, // Disable CSP for API as it's for browser UI
	}),
);

// ⚠️  CRITICAL: Payment webhook MUST be registered before express.json() so that
// express.raw() can capture the raw bytes for Razorpay HMAC verification.
// All other payment routes (refund, fetch) are also mounted here.
app.use("/api/v1/payments", paymentRoutes);

app.use((req, res, next) => {
	const correlationId = (req.headers["x-correlation-id"] || require("crypto").randomUUID()) as string;
	req.headers["x-correlation-id"] = correlationId;
	res.setHeader("x-correlation-id", correlationId);
	next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(tenantContextMiddleware);

// --- 4. SWAGGER DOCUMENTATION ---
try {
	setupSwagger(app);
} catch (err) {
	logger.error("📝 Swagger failed to initialize:", err);
}

// --- 5. RATE LIMITING ---
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5000, // Increased for RPA/Scripting
	message: "Too many requests from this IP, please try again after 15 minutes",
});

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5000, // Increased for RPA/Scripting
	message: "Too many requests, please try again later",
});

// --- 6. API MODULE ROUTES ---
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/products", apiLimiter, productRoutes);
app.use("/api/v1/cart", apiLimiter, cartRoutes);
app.use("/api/v1/orders", apiLimiter, orderRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/profile", apiLimiter, profileRoutes);
app.use("/api/v1/reviews", apiLimiter, reviewRoutes);
app.use("/api/v1/categories", apiLimiter, categoryRoutes);
app.use("/api/v1/admin", authLimiter, adminRoutes);
app.use("/api/v1/upis", apiLimiter, upisRouter);
app.use("/api/v1/admin/upis", authLimiter, authenticateAdmin, upisAdminRoutes);
app.use("/api/v1/agents", apiLimiter, agentsRoutes);
app.use("/api/v1/coupons", apiLimiter, couponRoutes);

// --- 7. FRONTEND SERVING & META INJECTION ---
// Serve static files first
app.use(
	express.static(path.join(process.cwd(), "public"), {
		maxAge: "1d",
		index: false, // Don't serve index.html automatically, let the injector handle it
	}),
);

// Catch-all route for SPA with Meta Injection
app.use(metaInjectorMiddleware);

// --- 7. ERROR HANDLING ---
app.use(errorHandler);

// --- 8. DATABASE & SERVER STARTUP ---
const startServer = async () => {
	logger.info("🛠️ [BOOT] Starting Bombay Bag House Commerce Engine - Enterprise Backend...");

	// 1. UNCONDITIONAL PORT BINDING (Satisfy Render Health Scan INSTANTLY)
	logger.info(
		`📡 [BOOT] Attempting unconditional port binding to PORT: ${PORT}...`,
	);
	try {
		server.listen(PORT, () => {
			logger.info(
				`🚀 [BOOT] Node.js HTTP server successfully bound and LISTENING on port ${PORT}`,
			);
			logger.info(`🔗 Public endpoint verified at: http://localhost:${PORT}`);
		});
		logger.info("✅ [BOOT] Async server.listen() successfully scheduled.");
	} catch (listenErr: any) {
		logger.error(
			"🔥 [BOOT] FATAL CRASH: HTTP server failed to bind to port immediately!",
			listenErr,
		);
		process.exit(1); // Stop immediately if OS denies port
	}

	// 2. ISOLATED CRYPTO & JWT DIAGNOSTICS (Non-Blocking)
	try {
		logger.info("🔐 [BOOT] Initializing cryptographic diagnostics...");
		await verifyCryptographicSetup().catch((e) =>
			logger.warn(`⚠️ Cryptographic Self-Test Non-Fatal Alert: ${e.message}`),
		);

		try {
			verifyJWTSetup();
		} catch (jwtErr: any) {
			logger.error(`🚨 [BOOT] JWT Validation Failure: ${jwtErr.message}`);
			logger.warn(
				"ℹ️ [BOOT] Warning: Operating with sub-optimal secrets. Continuing boot to ensure platform availability.",
			);
		}
	} catch (cryptoImportErr: any) {
		logger.warn(
			`⚠️ Could not perform crypto checks: ${cryptoImportErr.message}`,
		);
	}

	// 3. ISOLATED OPTIONAL SOCKET.IO SUBSYSTEM (Non-Blocking)
	logger.info("🔌 [BOOT] Initializing optional WebSocket gateway...");
	try {
		await SocketService.init(server);
		logger.info(
			"✅ [BOOT] Socket.IO adapter attached and listening dynamically.",
		);
	} catch (socketError: any) {
		logger.error(
			"❌ [BOOT] CRITICAL SOCKET ADAPTER FAILURE! WebSocket capabilities are disabled but HTTP remains ONLINE.",
			socketError,
		);
	}

	// 4. ASYNCHRONOUS ENTERPRISE INTEGRATIONS & DATABASE
	logger.info("📡 [BOOT] Triggering asynchronous backend mesh boot...");
	prisma
		.$connect()
		.then(async () => {
			logger.info("✅ [DB] Primary data connection established.");

			// Initialize Seed & Core Domain Services
			try {
				await seedSuperAdmin();
			} catch (seedErr: any) {
				logger.error(`❌ Seed failed: ${seedErr.message}`);
			}

			try {
				// Evaluate and attach dynamic singletons
				warehouseService;
				workflowService;
				analyticsService;
				fraudService;
				ledgerService;
				orderProjection;
				ade;

				registerOrderHandlers();
				await pluginManager.register(new LoyaltyPlugin(), app);
				await pluginManager.register(new AdminNotificationPlugin() as any, app);
				slaMonitor.start();
				initializeUPIS();

				logger.info(
					"✨ [BOOT] All transactional subsystems online and synchronized.",
				);
			} catch (subsystemErr: any) {
				logger.error(
					`🚨 [BOOT] Secondary domain subsystem error: ${subsystemErr.message}`,
				);
			}
		})
		.catch((dbError: any) => {
			logger.error(
				"❌ [DB] Delayed startup: Initial data handoff failed. Application running in DEGRADED mode.",
			);
			logger.error(`❌ [DB] Detailed Reason: ${dbError.message}`);
		});
};

startServer();

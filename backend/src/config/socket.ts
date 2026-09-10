import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { logger } from "./logger";
import { env } from "./env";

export class SocketService {
	private static io: SocketIOServer;

	static async init(server: HttpServer) {
		this.io = new SocketIOServer(server, {
			cors: {
				origin: (origin, callback) => {
					if (!origin) return callback(null, true);
					const cleanOrigin = origin.replace(/\/$/, "");

					const isLocal =
						cleanOrigin === "https://localhost" ||
						cleanOrigin === "http://localhost" ||
						cleanOrigin.startsWith("capacitor://") ||
						cleanOrigin.includes("localhost:");

					if (isLocal) return callback(null, true);

					const allowedOrigins = [
						env.CORS_ORIGIN,
						"https://trivenibombaybaghouse.vercel.app",
						"https://trivenibombaybaghouse.onrender.com",
					].map((o) => o?.replace(/\/$/, ""));

					const isAllowed = allowedOrigins.some(
						(o) => o && (cleanOrigin === o || cleanOrigin.startsWith(o)),
					);
					const isVercel = cleanOrigin.endsWith(".vercel.app");

					if (isAllowed || isVercel) {
						callback(null, true);
					} else {
						callback(new Error("Not allowed by CORS"));
					}
				},
				methods: ["GET", "POST"],
				credentials: true,
			},
		});

		// Horizontal Scalability: Redis Adapter
		if (env.REDIS_URL) {
			try {
				const pubClient = createClient({ url: env.REDIS_URL });
				const subClient = pubClient.duplicate();

				await Promise.all([pubClient.connect(), subClient.connect()]);

				this.io.adapter(createAdapter(pubClient, subClient));
				logger.info("🧠 Socket.IO Redis adapter enabled");
			} catch (err) {
				logger.error("❌ Redis Adapter failed:", err);
			}
		}

		this.io.on("connection", (socket) => {
			logger.info(`🔌 New socket connection: ${socket.id}`);

			// Join personal user room
			socket.on("join_user", (userId: string) => {
				socket.join(`user:${userId}`);
				logger.info(`👤 User ${userId} joined their room`);
			});

			// Join admin room
			socket.on("join_admin", () => {
				socket.join("admin:orders");
				logger.info("🧑💼 Admin joined orders room");
			});

			// Join specific order room
			socket.on("join_order", (orderId: string) => {
				socket.join(`order:${orderId}`);
				logger.debug(`📦 Socket ${socket.id} joined order room: ${orderId}`);
			});

			socket.on("disconnect", () => {
				logger.info(`🔌 Socket disconnected: ${socket.id}`);
			});
		});

		logger.info("📡 Socket.IO initialized");
		return this.io;
	}

	/**
	 * Emit to a specific room
	 */
	static emitToRoom(room: string, event: string, data: any) {
		if (!this.io) {
			logger.warn(
				`[Socket] Offline/Uninitialized: Bypassed emission to room '${room}' [Event: ${event}]`,
			);
			return;
		}
		this.io.to(room).emit(event, data);
		logger.debug(`📤 Emitted ${event} to ${room}`);
	}

	/**
	 * Emit to all admins
	 */
	static emitToAdmins(event: string, data: any) {
		this.emitToRoom("admin:orders", event, data);
	}

	/**
	 * Emit to a specific user
	 */
	static emitToUser(userId: string, event: string, data: any) {
		this.emitToRoom(`user:${userId}`, event, data);
	}

	/**
	 * Emit to anyone following a specific order
	 */
	static emitToOrder(orderId: string, event: string, data: any) {
		this.emitToRoom(`order:${orderId}`, event, data);
	}
}

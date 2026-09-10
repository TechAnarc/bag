import { Request, Response, NextFunction } from "express";
import { upisService } from "../upis.service";
import { prisma } from "../../../config/database";

/**
 * Admin Intelligence Controller
 * Provides a 360° command center view of users.
 */
export class AdminIntelligenceController {
	/**
	 * GET /api/v1/admin/upis/users/:id/intelligence
	 * The Ultimate Unified Intelligence View (Digital Twin Replay)
	 */
	async getUser360(req: Request, res: Response, next: NextFunction) {
		try {
			const id = req.params.id as string;

			// Ensure digital twin exists before querying
			await upisService.ensureTwinExists(id);

			const data = await upisService.getCustomer360(id);

			if (!data.identity) {
				res.status(404).json({ success: false, message: "Identity not found" });
				return;
			}

			res.json({
				success: true,
				data,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/v1/admin/upis/users
	 * List users with UPIS classification metrics
	 */
	async listUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const page = Number(req.query.page) || 1;
			const limit = Number(req.query.limit) || 100; // fetch more by default
			const stage = req.query.stage as string;
			const search = req.query.search as string;

			const userWhere: any = {};
			if (search) {
				userWhere.OR = [
					{ name: { contains: search, mode: "insensitive" } },
					{ email: { contains: search, mode: "insensitive" } },
					{ phone: { contains: search, mode: "insensitive" } },
				];
			}

			// If stage filter applied, we first get user IDs from intelligence table
			let filteredUserIds: string[] | undefined;
			if (stage && stage !== "all") {
				const matchingIntelligence = await (prisma as any).userIntelligence.findMany({
					where: { lifecycleStage: stage },
					select: { userId: true },
				});
				filteredUserIds = matchingIntelligence.map((i: any) => i.userId);
				if (filteredUserIds && filteredUserIds.length > 0) {
					userWhere.id = { in: filteredUserIds };
				} else {
					// No users match this stage - return empty
					return res.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
				}
			}

			const [users, total] = await Promise.all([
				(prisma.user as any).findMany({
					where: userWhere,
					include: {
						intelligence: true,
						orders: {
							select: {
								id: true,
								orderNumber: true,
								total: true,
								status: true,
								paymentStatus: true,
								createdAt: true,
							},
							orderBy: { createdAt: "desc" },
							take: 5,
						},
						_count: {
							select: { orders: true },
						},
					},
					skip: (page - 1) * limit,
					take: limit,
					orderBy: { createdAt: "desc" },
				}),
				prisma.user.count({ where: userWhere }),
			]);

			// Fetch recent behavioral events for all returned users in a single batch query
			const userIds = users.map((u: any) => u.id);
			let recentEventsByUser: Record<string, any[]> = {};

			if (userIds.length > 0) {
				try {
					const recentEvents = await (prisma as any).behavioralEvent.findMany({
						where: { userId: { in: userIds } },
						orderBy: { occurredAt: "desc" },
						take: 500,
						select: {
							id: true,
							userId: true,
							eventType: true,
							entityId: true,
							payload: true,
							occurredAt: true,
						},
					});
					for (const ev of recentEvents) {
						if (!ev.userId) continue;
						if (!recentEventsByUser[ev.userId]) recentEventsByUser[ev.userId] = [];
						if (recentEventsByUser[ev.userId].length < 15) {
							recentEventsByUser[ev.userId].push(ev);
						}
					}
				} catch (_) {
					// behavioral events table may not exist yet - graceful fallback
				}
			}

			// Ensure every user has a default intelligence shape for the UI
			const enrichedUsers = users.map((user: any) => ({
				...user,
				intelligence: user.intelligence || {
					ltv: 0,
					aov: 0,
					orderCount: user._count?.orders || 0,
					totalSpent: 0,
					sessionCount: 0,
					productViewsCount: 0,
					cartAdditions: 0,
					checkoutAttempts: 0,
					abandonedCarts: 0,
					conversionScore: 0,
					churnScore: 0,
					riskScore: 0,
					trustIndex: 0.5,
					lifecycleStage: "NEW",
					lastActiveAt: user.lastLoginAt || user.createdAt,
				},
				recentEvents: recentEventsByUser[user.id] || [],
			}));

			res.json({
				success: true,
				data: enrichedUsers,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/v1/admin/upis/visitor-radar
	 * High-performance operational feed of ALL continuous visitor traffic (Phase 4)
	 */
	async getVisitorRadar(req: Request, res: Response, next: NextFunction) {
		try {
			const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 Hours

			// 1. Fetch very recent streaming raw events for the "Live Ticker"
			const recentStreams = await (prisma as any).behavioralEvent.findMany({
				where: { occurredAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } }, // Last 30 mins
				orderBy: { occurredAt: "desc" },
				take: 50,
			});

			// 2. Fetch distinct active sessions aggregated from raw event table
			// We can use manual grouping logic after finding many for maximum compatibility
			const activeEvents = await (prisma as any).behavioralEvent.findMany({
				where: { occurredAt: { gte: timeLimit } },
				orderBy: { occurredAt: "desc" },
				take: 500,
			});

			// Group sessions analytically efficiently without heavy DB compute
			const sessionsMap = new Map();
			activeEvents.forEach((evt: any) => {
				// Try to find reliable ID
				const visitorId =
					evt.metadata?.visitorId ||
					evt.payload?.visitorId ||
					evt.userId ||
					"UNKNOWN";
				if (!sessionsMap.has(visitorId)) {
					sessionsMap.set(visitorId, {
						id: visitorId,
						lastActive: evt.occurredAt,
						eventCount: 0,
						isAuthenticated: !!evt.userId,
						recentPage: evt.entityId || "INDEX",
						actions: [],
					});
				}
				const s = sessionsMap.get(visitorId);
				s.eventCount += 1;
				if (s.actions.length < 5) s.actions.push(evt.eventType);
			});

			const groupedSessions = Array.from(sessionsMap.values());

			res.json({
				success: true,
				data: {
					liveTicker: recentStreams,
					activeSessions: groupedSessions,
					summary: {
						activeCount: groupedSessions.length,
						streamingCount: recentStreams.length,
						updatedAt: new Date(),
					},
				},
			});
		} catch (error) {
			next(error);
		}
	}
}

export const adminIntelligenceController = new AdminIntelligenceController();

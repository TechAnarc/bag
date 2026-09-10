import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess, sendError } from "../../utils/response";
import { logger } from "../../config/logger";
import { env } from "../../config/env";
import {
	registerSchema,
	loginSchema,
	requestMobileOtpSchema,
	verifyOtpSchema,
	googleAuthSchema,
	supabaseAuthSchema,
} from "./auth.validation";
import { eventBus, DomainEvent } from "../../core/events/event-bus";
import { upisService } from "../upis/upis.service";
import { otpService } from "./services/otp.service";
import { smsService } from "./services/sms.service";

export class AuthController {
	private authService: AuthService;

	constructor() {
		this.authService = new AuthService();
	}

	// Helper to set httpOnly cookies
	private setAuthCookies(
		res: Response,
		accessToken: string,
		refreshToken: string,
	) {
		const isProduction = env.NODE_ENV === "production";

		// Set access token cookie (15 minutes)
		res.cookie("access_token", accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
			maxAge: 15 * 60 * 1000,
		});

		// Set refresh token cookie (7 days)
		res.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
	}

	private clearAuthCookies(res: Response) {
		res.clearCookie("access_token");
		res.clearCookie("refresh_token");
	}

	register = async (req: Request, res: Response) => {
		try {
			const validated = registerSchema.parse(req.body);
			const result = await this.authService.register(
				validated as any,
				req.ip,
				req.headers["user-agent"],
			);

			// Set auth cookies immediately (no OTP step)
			this.setAuthCookies(res, result.accessToken, result.refreshToken);

			// 🧬 Vector 5: Identity Fusion Execution (Async)
			const visitorId = req.headers["x-visitor-id"] as string;
			if (visitorId) {
				upisService
					.fuseIdentity(visitorId, result.user.id)
					.catch((e) =>
						logger.error(`[Fusion] Register failed for ${result.user.id}`, e),
					);
			}

			// Also return token in body for cross-domain localStorage persistence
			return sendSuccess(
				res,
				"Registration successful",
				{ user: result.user, accessToken: result.accessToken },
				201,
			);
		} catch (error: any) {
			logger.error(`Registration error: ${error.message}`);
			return sendError(res, error.message, 400);
		}
	};

	login = async (req: Request, res: Response) => {
		try {
			const validated = loginSchema.parse(req.body);
			const result = await this.authService.login(
				validated.emailOrPhone,
				validated.password,
				req.ip,
				req.headers["user-agent"],
			);

			this.setAuthCookies(res, result.accessToken!, result.refreshToken!);

			// 🧠 UPIS: Emit Auth Event
			eventBus.emitDomainEvent(
				DomainEvent.USER_LOGIN,
				{
					userId: result.user!.id,
					method: "password",
				},
				{ actor: result.user!.id },
			);

			// 🧬 Vector 5: Identity Fusion Execution (Async)
			const visitorId = req.headers["x-visitor-id"] as string;
			if (visitorId) {
				upisService
					.fuseIdentity(visitorId, result.user!.id)
					.catch((e) =>
						logger.error(`[Fusion] Login failed for ${result.user!.id}`, e),
					);
			}

			// Also return token in body for cross-domain localStorage persistence
			return sendSuccess(res, "Login successful", {
				user: result.user!,
				accessToken: result.accessToken!,
			});
		} catch (error: any) {
			logger.error(`Login error: ${error.message}`);
			return sendError(res, error.message, 401);
		}
	};

	refresh = async (req: Request, res: Response) => {
		try {
			const refreshToken = req.cookies.refresh_token;

			if (!refreshToken) {
				return sendError(res, "Refresh token is required", 401);
			}

			const result = await this.authService.refreshToken(refreshToken);
			this.setAuthCookies(res, result.accessToken, result.newRefreshToken);

			return sendSuccess(res, "Token refreshed successfully", {});
		} catch (error: any) {
			logger.error(`Refresh error: ${error.message}`);
			this.clearAuthCookies(res);
			return sendError(res, error.message, 401);
		}
	};

	logout = async (req: Request, res: Response) => {
		try {
			this.clearAuthCookies(res);
			return sendSuccess(res, "Logout successful", {});
		} catch (error: any) {
			logger.error(`Logout error: ${error.message}`);
			return sendError(res, error.message, 500);
		}
	};

	requestMobileOTP = async (req: Request, res: Response) => {
		try {
			const validated = requestMobileOtpSchema.parse(req.body);
			let phone = validated.phone.trim();
			if (phone.startsWith("+91")) phone = phone.substring(3);
			if (phone.startsWith("91") && phone.length === 12)
				phone = phone.substring(2);

			if (!/^[6-9]\d{9}$/.test(phone)) {
				return sendError(
					res,
					"Please enter a valid 10-digit Indian mobile number.",
					400,
				);
			}

			const otpResult = await otpService.sendOTP({
				phone,
				type: "LOGIN",
				ipAddress: req.ip,
				userAgent: req.headers["user-agent"],
			});

			await smsService.sendOTP(phone, otpResult.otp);

			return sendSuccess(res, "OTP generated and sent successfully", {
				requestId: otpResult.requestId,
				expiresAt: otpResult.expiresAt,
			});
		} catch (error: any) {
			logger.error(`[Auth] OTP generation failure: ${error.message}`);
			return sendError(res, error.message || "Unable to generate OTP", 400);
		}
	};

	verifyMobileOTP = async (req: Request, res: Response) => {
		try {
			const validated = verifyOtpSchema.parse(req.body);

			const session = await otpService.verifyOTP({
				requestId: validated.requestId,
				otp: validated.otp,
				ipAddress: req.ip,
				userAgent: req.headers["user-agent"],
			});

			if (!session.phone) {
				return sendError(res, "Invalid session linkage.", 400);
			}

			const result = await this.authService.loginOrProvisionByPhone(
				session.phone,
				req.ip,
				req.headers["user-agent"],
			);

			this.setAuthCookies(res, result.accessToken, result.refreshToken);

			eventBus.emitDomainEvent(
				DomainEvent.USER_LOGIN,
				{
					userId: result.user.id,
					method: "OTP",
				},
				{ actor: result.user.id },
			);

			const visitorId = req.headers["x-visitor-id"] as string;
			if (visitorId) {
				upisService
					.fuseIdentity(visitorId, result.user.id)
					.catch((e) =>
						logger.error(
							`[Fusion] Failed syncing visitor state for user ID ${result.user.id}`,
							e,
						),
					);
			}

			return sendSuccess(res, "Successfully authenticated.", {
				user: result.user,
				accessToken: result.accessToken,
			});
		} catch (error: any) {
			logger.error(`[Auth] Unified verify failure: ${error.message}`);
			return sendError(res, error.message || "Verification failed", 401);
		}
	};

	googleAuth = async (req: Request, res: Response) => {
		try {
			const validated = googleAuthSchema.parse(req.body);

			const result = await this.authService.loginOrProvisionByGoogle(
				validated.idToken,
				req.ip,
				req.headers["user-agent"],
			);

			// 1. Mount double-persistence cookies
			this.setAuthCookies(res, result.accessToken, result.refreshToken);

			// 2. Disseminate behavioral event for user intelligence and risk scoring
			eventBus.emitDomainEvent(
				DomainEvent.USER_LOGIN,
				{
					userId: result.user.id,
					method: "GOOGLE",
				},
				{ actor: result.user.id },
			);

			// 3. 🧬 Seamless cart / behavior merge for anonymous flow
			const visitorId = req.headers["x-visitor-id"] as string;
			if (visitorId) {
				upisService
					.fuseIdentity(visitorId, result.user.id)
					.catch((e) =>
						logger.error(
							`[Fusion] Google auth fusion failed for ${result.user.id}`,
							e,
						),
					);
			}

			// 4. Final response wrapper
			return sendSuccess(res, "Google identity authenticated successfully.", {
				user: result.user,
				accessToken: result.accessToken,
			});
		} catch (error: any) {
			logger.error(`[Auth] Google Auth dynamic failure: ${error.message}`);
			return sendError(
				res,
				error.message || "Google authentication failed",
				401,
			);
		}
	};

	supabaseAuth = async (req: Request, res: Response) => {
		try {
			const validated = supabaseAuthSchema.parse(req.body);

			const result = await this.authService.loginOrProvisionBySupabase(
				validated.accessToken,
				req.ip,
				req.headers["user-agent"],
			);

			// 1. Commit persistence cookies
			this.setAuthCookies(res, result.accessToken, result.refreshToken);

			// 2. Disseminate identity continuity tracking event
			eventBus.emitDomainEvent(
				DomainEvent.USER_LOGIN,
				{
					userId: result.user.id,
					method: "SUPABASE",
				},
				{ actor: result.user.id },
			);

			// 3. Auto-Bridge commerce continuity state (Cart & Wishlist)
			const visitorId = req.headers["x-visitor-id"] as string;
			if (visitorId) {
				upisService
					.fuseIdentity(visitorId, result.user.id)
					.catch((e) =>
						logger.error(
							`[Fusion] Supabase continuity bridge failed for user ${result.user.id}`,
							e,
						),
					);
			}

			// 4. Success container rehydration
			return sendSuccess(res, "Resilient identity session verified.", {
				user: result.user,
				accessToken: result.accessToken,
			});
		} catch (error: any) {
			logger.error(`[Auth] Supabase recovery session error: ${error.message}`);
			return sendError(
				res,
				error.message || "Identity verification failure.",
				401,
			);
		}
	};
}

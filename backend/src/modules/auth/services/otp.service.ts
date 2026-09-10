import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../../config/database";
import { env } from "../../../config/env";
import { logger } from "../../../config/logger";
import { OtpType, OtpStatus } from "@prisma/client";

export class OtpService {
	/**
	 * Generate a random 6-digit OTP
	 */
	private generateOTP(): string {
		if (env.NODE_ENV === "development" && process.env.FIXED_OTP) {
			return process.env.FIXED_OTP;
		}
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	/**
	 * Send OTP to target (email or phone)
	 */
	async sendOTP(params: {
		userId?: string;
		email?: string;
		phone?: string;
		type: OtpType;
		ipAddress?: string;
		userAgent?: string;
	}) {
		const { userId, email, phone, type, ipAddress, userAgent } = params;

		// 1. Anti-abuse: Check for existing pending OTPs to enforce cooldown
		const orConditions: any[] = [];
		if (email) orConditions.push({ email });
		if (phone) orConditions.push({ phone });

		// If no target (which shouldn't happen based on types but good for safety), default to empty check
		if (orConditions.length === 0) {
			throw new Error("No email or phone provided for OTP.");
		}

		const lastOtp = await prisma.otpSession.findFirst({
			where: {
				OR: orConditions,
				type,
				status: OtpStatus.PENDING,
			},
			orderBy: { createdAt: "desc" },
		});

		if (lastOtp) {
			const secondsSinceLast =
				(Date.now() - lastOtp.createdAt.getTime()) / 1000;
			if (secondsSinceLast < env.OTP_RESEND_COOLDOWN_SECONDS) {
				throw new Error(
					`Please wait ${Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting a new OTP.`,
				);
			}

			// Check hourly resend limit
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const resendCount = await prisma.otpSession.count({
				where: {
					OR: orConditions,
					createdAt: { gte: oneHourAgo },
				},
			});

			if (resendCount >= env.OTP_MAX_RESEND_PER_HOUR) {
				throw new Error("Too many OTP requests. Please try again in an hour.");
			}

			// Invalidate old pending OTP
			await prisma.otpSession.update({
				where: { id: lastOtp.id },
				data: { status: OtpStatus.EXPIRED },
			});
		}

		// 2. Determine if using Supabase delivery for Phone OTP
		let otp = "SUPABASE_MANAGED";
		let otpHash = "SUPABASE_MANAGED";

		const useSupabaseOtp = !!(
			phone &&
			env.SUPABASE_URL &&
			env.SUPABASE_SERVICE_ROLE_KEY &&
			!(env.NODE_ENV === "development" && process.env.FIXED_OTP)
		);

		if (useSupabaseOtp) {
			try {
				const { createClient } = await import("@supabase/supabase-js");
				const supabase = createClient(
					env.SUPABASE_URL!,
					env.SUPABASE_SERVICE_ROLE_KEY!,
				);
				const fullPhone = `+91${phone}`;

				logger.info(
					`[OTP] Dispatching resilient Supabase OTP request to ${fullPhone}`,
				);
				const { error } = await supabase.auth.signInWithOtp({
					phone: fullPhone,
				});

				if (error) {
					throw error;
				}
			} catch (err: any) {
				logger.error(
					`[OTP] Supabase delivery failure for ${phone}: ${err.message}`,
				);
				throw new Error(
					`Failed to dispatch verification code via SMS: ${err.message}`,
				);
			}
		} else {
			otp = this.generateOTP();
			otpHash = await bcrypt.hash(otp, env.BCRYPT_SALT_ROUNDS);
		}

		const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
		const requestId = crypto.randomBytes(16).toString("hex");

		// 3. Save to DB
		const session = await prisma.otpSession.create({
			data: {
				userId,
				email,
				phone,
				otpHash,
				type,
				expiresAt,
				ipAddress,
				userAgent,
				requestId,
				status: OtpStatus.PENDING,
			},
		});

		// 4. Log request if strict logging is enabled
		if (env.STRICT_AUTH_LOGGING) {
			await prisma.auditLog.create({
				data: {
					actorType: userId ? "USER" : "SYSTEM",
					actorId: userId || "GUEST",
					action: `OTP_REQUEST_${type}`,
					ip: ipAddress,
					userAgent,
					metadata: { requestId, target: email || phone },
				},
			});
		}

		// 5. Log execution
		if (otpHash === "SUPABASE_MANAGED") {
			logger.info(
				`[OTP] Supabase managed OTP dispatched for ${phone} (Request ID: ${requestId})`,
			);
		} else {
			logger.info(
				`[OTP] Locally generated OTP for ${email || phone}: ${otp} (Request ID: ${requestId})`,
			);
		}

		return { requestId, expiresAt, otp }; // OTP returned only for system/integration use if needed, usually we just return requestId
	}

	/**
	 * Verify OTP
	 */
	async verifyOTP(params: {
		requestId: string;
		otp: string;
		ipAddress?: string;
		userAgent?: string;
	}) {
		const { requestId, otp, ipAddress, userAgent } = params;

		const session = await prisma.otpSession.findUnique({
			where: { requestId },
		});

		if (!session) {
			throw new Error("Invalid OTP session.");
		}

		if (session.status !== OtpStatus.PENDING) {
			throw new Error(`OTP is already ${session.status.toLowerCase()}.`);
		}

		if (new Date() > session.expiresAt) {
			await prisma.otpSession.update({
				where: { id: session.id },
				data: { status: OtpStatus.EXPIRED },
			});
			throw new Error("OTP has expired.");
		}

		if (session.attempts >= env.OTP_MAX_ATTEMPTS) {
			await prisma.otpSession.update({
				where: { id: session.id },
				data: { status: OtpStatus.LOCKED },
			});
			throw new Error("Too many failed attempts. This OTP is now locked.");
		}

		// Verify hash or delegate to Supabase
		let isValid = false;

		if (session.otpHash === "SUPABASE_MANAGED" && session.phone) {
			try {
				const { createClient } = await import("@supabase/supabase-js");
				const supabase = createClient(
					env.SUPABASE_URL!,
					env.SUPABASE_SERVICE_ROLE_KEY!,
				);
				const fullPhone = `+91${session.phone}`;

				logger.info(
					`[OTP] Delegating OTP verification to Supabase Resilience Engine for ${fullPhone}`,
				);
				const { error } = await supabase.auth.verifyOtp({
					phone: fullPhone,
					token: otp,
					type: "sms",
				});

				if (error) {
					logger.warn(`[OTP] Supabase verification failure: ${error.message}`);
					isValid = false;
				} else {
					isValid = true;
				}
			} catch (err: any) {
				logger.error(`[OTP] Supabase verify exception: ${err.message}`);
				isValid = false;
			}
		} else {
			isValid = await bcrypt.compare(otp, session.otpHash);
		}

		if (!isValid) {
			await prisma.otpSession.update({
				where: { id: session.id },
				data: { attempts: { increment: 1 } },
			});
			throw new Error("Invalid OTP. Please try again.");
		}

		// Mark as verified
		await prisma.otpSession.update({
			where: { id: session.id },
			data: { status: OtpStatus.VERIFIED },
		});

		// Log success
		if (env.STRICT_AUTH_LOGGING) {
			await prisma.auditLog.create({
				data: {
					actorType: session.userId ? "USER" : "SYSTEM",
					actorId: session.userId || "GUEST",
					action: `OTP_VERIFY_SUCCESS_${session.type}`,
					ip: ipAddress,
					userAgent,
					metadata: { requestId },
				},
			});
		}

		return session;
	}
}

export const otpService = new OtpService();

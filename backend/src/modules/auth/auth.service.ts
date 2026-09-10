import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthRepository } from "./auth.repository";
import { Role, User } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { prisma } from "../../config/database";
import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";

const googleClient = new OAuth2Client();

export class AuthService {
	private repository: AuthRepository;

	constructor() {
		this.repository = new AuthRepository();
	}

	generateTokenPair(payload: {
		id: string;
		email: string;
		role: string;
		type: "USER" | "ADMIN";
	}) {
		const accessToken = jwt.sign(
			{
				sub: payload.id,
				email: payload.email,
				role: payload.role,
				type: payload.type,
			},
			env.JWT_ACCESS_SECRET,
			{ expiresIn: env.JWT_ACCESS_EXPIRY } as any,
		);

		const refreshToken = jwt.sign(
			{ sub: payload.id, type: payload.type },
			env.JWT_REFRESH_SECRET,
			{ expiresIn: env.JWT_REFRESH_EXPIRY } as any,
		);

		return { accessToken, refreshToken };
	}

	// Support legacy methods for now
	generateAccessToken(user: User): string {
		return this.generateTokenPair({
			id: user.id,
			email: user.email || "",
			role: user.role,
			type: "USER",
		}).accessToken;
	}

	generateRefreshToken(user: User): string {
		return this.generateTokenPair({
			id: user.id,
			email: user.email || "",
			role: user.role,
			type: "USER",
		}).refreshToken;
	}

	async hashPassword(password: string): Promise<string> {
		const saltRounds = env.BCRYPT_SALT_ROUNDS;
		return bcrypt.hash(password, saltRounds);
	}

	async comparePasswords(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	/**
	 * Register - Direct registration without OTP verification
	 * Creates a VERIFIED user immediately and returns auth tokens
	 */
	async register(
		data: {
			name: string;
			email: string;
			phone: string;
			password?: string;
			verificationMethod: "EMAIL" | "PHONE";
		},
		ipAddress?: string,
		userAgent?: string,
	) {
		// 1. Check if identity already exists
		const existingEmail = await this.repository.findByEmail(data.email);
		if (existingEmail) throw new Error("Email already registered");

		const existingPhone = await this.repository.findByPhone(data.phone);
		if (existingPhone) throw new Error("Phone number already registered");

		// 2. Hash Password
		const passwordHash = await this.hashPassword(
			data.password || "temp_pass_123",
		);

		// 3. Create user as VERIFIED directly (no OTP required)
		const user = await this.repository.createUser({
			name: data.name,
			email: data.email,
			phone: data.phone,
			passwordHash,
			status: "VERIFIED" as any,
		});

		// 4. Mark email and phone as verified
		await (prisma.user as any).update({
			where: { id: user.id },
			data: {
				isEmailVerified: true,
				isPhoneVerified: true,
			},
		});

		// 5. Issue Auth Session immediately
		await this.repository.updateLastLogin(user.id);
		const { accessToken, refreshToken } = this.generateTokenPair({
			id: user.id,
			email: user.email || "",
			role: user.role,
			type: "USER",
		});

		logger.info(
			`[AUTH] User registered and verified instantly: ${user.email || user.phone}`,
		);

		return { user: { ...user, status: "VERIFIED" }, accessToken, refreshToken };
	}

	/**
	 * Login - Direct login without OTP verification
	 * Auto-verifies any UNVERIFIED users and logs them in
	 */
	async login(
		emailOrPhone: string,
		password: string,
		ipAddress?: string,
		userAgent?: string,
	) {
		// 1. Find user
		let user = await this.repository.findByEmail(emailOrPhone);
		if (!user) {
			user = await this.repository.findByPhone(emailOrPhone);
		}

		if (!user) {
			throw new Error("USER_NOT_FOUND");
		}

		if (user.isBlocked || (user as any).status === "BLOCKED") {
			throw new Error(
				`Account blocked: ${user.blockedReason || "Policy violation"}`,
			);
		}

		// 2. Check if account deleted
		const wasDeleted = await this.repository.findDeletedUserById(user.id);
		if (wasDeleted) throw new Error("This account has been deleted");

		// 3. Verify password
		const isMatch = await this.comparePasswords(password, user.passwordHash);
		if (!isMatch) throw new Error("Invalid credentials");

		// 4. If UNVERIFIED, auto-verify the user (no OTP needed)
		if ((user as any).status === "UNVERIFIED") {
			await this.repository.updateUserStatus(user.id, "VERIFIED" as any);
			await (prisma.user as any).update({
				where: { id: user.id },
				data: {
					isEmailVerified: true,
					isPhoneVerified: true,
				},
			});
			logger.info(
				`[AUTH] Auto-verified unverified user on login: ${user.email || user.phone}`,
			);
		}

		// 5. Success - Update last login and issue tokens
		await this.repository.updateLastLogin(user.id);

		const { accessToken, refreshToken } = this.generateTokenPair({
			id: user.id,
			email: user.email || "",
			role: user.role,
			type: "USER",
		});

		return { user, accessToken, refreshToken };
	}

	/**
	 * loginOrProvisionByPhone - Unified gateway to automatically provision a fully
	 * verified account if phone number doesn't exist, or log in the user immediately.
	 */
	async loginOrProvisionByPhone(
		phone: string,
		ipAddress?: string,
		userAgent?: string,
	) {
		let user = await this.repository.findByPhone(phone);

		if (!user) {
			// 1. Generative credentials for seamless background setup
			const generatedPassword = crypto.randomBytes(24).toString("hex");
			const passwordHash = await this.hashPassword(generatedPassword);

			// 2. Provision base User entity with fully VERIFIED status and verified fields immediately
			user = await this.repository.createUser({
				phone,
				passwordHash,
				name: "Valued Customer",
				status: "VERIFIED" as any,
			});

			// Mark phone as verified
			await (prisma.user as any).update({
				where: { id: user.id },
				data: { isPhoneVerified: true },
			});

			logger.info(
				`[AUTH] Auto-provisioned verified account via OTP for phone: ${phone}`,
			);
		} else {
			// Existing user verification safeguards
			if (user.isBlocked || (user as any).status === "BLOCKED") {
				throw new Error(
					`Account blocked: ${user.blockedReason || "Policy violation"}`,
				);
			}

			const wasDeleted = await this.repository.findDeletedUserById(user.id);
			if (wasDeleted) throw new Error("This account has been deleted");

			// Auto-verify legacy instances
			if ((user as any).status === "UNVERIFIED" || !user.isPhoneVerified) {
				await this.repository.updateUserStatus(user.id, "VERIFIED" as any);
				await (prisma.user as any).update({
					where: { id: user.id },
					data: { isPhoneVerified: true },
				});
			}
		}

		// 3. Trigger session hydration and tokens
		await this.repository.updateLastLogin(user.id);

		const { accessToken, refreshToken } = this.generateTokenPair({
			id: user.id,
			email: user.email || "",
			role: user.role,
			type: "USER",
		});

		return { user, accessToken, refreshToken };
	}

	/**
	 * loginOrProvisionByGoogle - Decodes Google idToken, executes verified identity checks,
	 * registers new email profile seamlessly and injects dual tokens.
	 */
	async loginOrProvisionByGoogle(
		idToken: string,
		ipAddress?: string,
		userAgent?: string,
	) {
		try {
			if (!env.GOOGLE_CLIENT_ID) {
				logger.error(
					"[AUTH] Google Login aborted: GOOGLE_CLIENT_ID environment variable is not configured on backend!",
				);
				throw new Error(
					"Google authentication is misconfigured on backend (missing Client ID).",
				);
			}

			const ticket = await googleClient.verifyIdToken({
				idToken,
				audience: env.GOOGLE_CLIENT_ID, // Must match to be secure
			});

			const payload = ticket.getPayload();
			if (!payload || !payload.email) {
				throw new Error(
					"Google Identity did not yield a valid verified email claim.",
				);
			}

			const { email, name, picture } = payload;
			let user = await this.repository.findByEmail(email);

			if (!user) {
				// 1. Generative cryptographic base pass
				const generatedPassword = crypto.randomBytes(24).toString("hex");
				const passwordHash = await this.hashPassword(generatedPassword);

				// 2. Provision profile instantly
				user = await this.repository.createUser({
					email,
					name: name || "Valued Customer",
					avatar: picture || null,
					passwordHash,
					status: "VERIFIED" as any,
				});

				// Force verify state
				await (prisma.user as any).update({
					where: { id: user.id },
					data: { isEmailVerified: true },
				});

				logger.info(
					`[AUTH] Background-provisioned Account for Google User: ${email}`,
				);
			} else {
				// Safety enforcement
				if (user.isBlocked || (user as any).status === "BLOCKED") {
					throw new Error(
						`Account blocked: ${user.blockedReason || "Policy violation"}`,
					);
				}

				const wasDeleted = await this.repository.findDeletedUserById(user.id);
				if (wasDeleted) throw new Error("This account has been deleted");

				// Promote verification status on login with trusted Google claim
				if ((user as any).status === "UNVERIFIED" || !user.isEmailVerified) {
					await this.repository.updateUserStatus(user.id, "VERIFIED" as any);
					await (prisma.user as any).update({
						where: { id: user.id },
						data: { isEmailVerified: true },
					});
				}

				// Sync up to date avatar/name if missing
				if (!user.avatar && picture) {
					await (prisma.user as any).update({
						where: { id: user.id },
						data: { avatar: picture },
					});
				}
			}

			// 3. Track access and return dual-layer tokens
			await this.repository.updateLastLogin(user.id);

			const { accessToken, refreshToken } = this.generateTokenPair({
				id: user.id,
				email: user.email || "",
				role: user.role,
				type: "USER",
			});

			return { user, accessToken, refreshToken };
		} catch (error: any) {
			logger.error(`[AUTH] Google validation engine error: ${error.message}`);
			throw new Error(`Google validation failed: ${error.message}`);
		}
	}

	/**
	 * loginOrProvisionBySupabase - Serves as the silent Identity Continuity Hub. Decrypts Supabase session
	 * tokens directly using standard HMAC-SHA256 JWT signatures, extracts claims, and handles sub-second
	 * user mappings & synchronization.
	 */
	async loginOrProvisionBySupabase(
		supabaseToken: string,
		ipAddress?: string,
		userAgent?: string,
	) {
		try {
			let userEmail = "";
			let fullName = "Valued Customer";
			let avatarUrl = "";

			// 1. Fast Path: Decrypt JWT via Shared Secret (No remote HTTP latency!)
			if (env.SUPABASE_JWT_SECRET) {
				try {
					const payload = jwt.verify(
						supabaseToken,
						env.SUPABASE_JWT_SECRET,
					) as any;
					userEmail = payload.email || payload.user_metadata?.email || "";
					fullName =
						payload.user_metadata?.full_name ||
						payload.user_metadata?.name ||
						"Valued Customer";
					avatarUrl =
						payload.user_metadata?.avatar_url ||
						payload.user_metadata?.picture ||
						"";
				} catch (jwtErr) {
					logger.warn(
						`[AUTH-SB] Fast path decrypt failed, falling back to direct SDK verification.`,
					);
				}
			}

			// 2. Fallback Path: Query Supabase Auth server directly if local decryption was bypassed
			if (!userEmail && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
				const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
				const {
					data: { user: sbUser },
					error,
				} = await client.auth.getUser(supabaseToken);

				if (error || !sbUser) {
					throw new Error(error?.message || "Supabase identity query failed.");
				}

				userEmail = sbUser.email || "";
				fullName =
					sbUser.user_metadata?.full_name ||
					sbUser.user_metadata?.name ||
					"Valued Customer";
				avatarUrl =
					sbUser.user_metadata?.avatar_url ||
					sbUser.user_metadata?.picture ||
					"";
			}

			if (!userEmail) {
				throw new Error(
					"Unable to resolve email identifier from Supabase session claims.",
				);
			}

			// 3. Direct Identity Resolution & Account Linking Unification
			let user = await this.repository.findByEmail(userEmail);

			if (!user) {
				// Create backdrop fallback pass
				const pass = crypto.randomBytes(24).toString("hex");
				const hash = await this.hashPassword(pass);

				user = await this.repository.createUser({
					email: userEmail,
					name: fullName,
					passwordHash: hash,
					status: "VERIFIED" as any,
					avatar: avatarUrl || null,
				});

				await (prisma.user as any).update({
					where: { id: user.id },
					data: { isEmailVerified: true },
				});

				logger.info(
					`[AUTH] Resilient profile provisioned via Supabase for ${userEmail}`,
				);
			} else {
				// Enforce dynamic safety block layers
				if (user.isBlocked || (user as any).status === "BLOCKED") {
					throw new Error(
						`Access Restricted: ${user.blockedReason || "Safety policy."}`,
					);
				}

				const deleted = await this.repository.findDeletedUserById(user.id);
				if (deleted) throw new Error("Account no longer active.");

				// Auto-sync avatar & promotes verified state silently
				const updates: any = {};
				if (!user.avatar && avatarUrl) updates.avatar = avatarUrl;
				if (!user.isEmailVerified || (user as any).status === "UNVERIFIED") {
					updates.isEmailVerified = true;
					updates.status = "VERIFIED";
				}

				if (Object.keys(updates).length > 0) {
					await (prisma.user as any).update({
						where: { id: user.id },
						data: updates,
					});
				}
			}

			// 4. Generate Native commerce session
			await this.repository.updateLastLogin(user.id);

			const { accessToken, refreshToken } = this.generateTokenPair({
				id: user.id,
				email: user.email || "",
				role: user.role,
				type: "USER",
			});

			return { user, accessToken, refreshToken };
		} catch (error: any) {
			logger.error(
				`[AUTH-SUPABASE] Resilient Continuity flow halted: ${error.message}`,
			);
			throw new Error(`Continuity session rejected: ${error.message}`);
		}
	}

	async refreshToken(token: string) {
		try {
			const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
				sub: string;
				type: "USER" | "ADMIN";
			};

			let subject: any;
			if (payload.type === "ADMIN") {
				subject = await prisma.admin.findUnique({ where: { id: payload.sub } });
			} else {
				subject = await this.repository.findById(payload.sub);
			}

			if (!subject) {
				throw new Error("Subject not found");
			}

			const pair = this.generateTokenPair({
				id: subject.id,
				email: subject.email,
				role: subject.role,
				type: payload.type,
			});

			return {
				accessToken: pair.accessToken,
				newRefreshToken: pair.refreshToken,
			};
		} catch (error) {
			throw new Error("Invalid refresh token");
		}
	}
}

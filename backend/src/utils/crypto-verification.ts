import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * CRYPTOGRAPHIC COMPATIBILITY VERIFICATION
 * Validates bcrypt configuration at startup to prevent runtime auth failures
 * FAIL-FAST: Blocks server boot if cryptographic setup is invalid
 */
export async function verifyCryptographicSetup(): Promise<void> {
	try {
		logger.info("🔐 Verifying cryptographic compatibility...");

		// 1. Validate BCRYPT_SALT_ROUNDS is a valid number
		const saltRounds = env.BCRYPT_SALT_ROUNDS;
		if (typeof saltRounds !== "number" || saltRounds < 4 || saltRounds > 31) {
			throw new Error(
				`BCRYPT_SALT_ROUNDS must be a number between 4 and 31. Got: ${saltRounds} (${typeof saltRounds})`,
			);
		}

		// 2. Test bcrypt hash generation
		const testPassword = "test_password_123";
		const hash = await bcrypt.hash(testPassword, saltRounds);

		// 3. Test bcrypt hash verification
		const isValid = await bcrypt.compare(testPassword, hash);
		if (!isValid) {
			throw new Error("bcrypt hash verification failed during startup test");
		}

		// 4. Validate hash format (bcrypt hashes start with $2a$, $2b$, or $2y$)
		if (!hash.match(/^\$2[aby]\$/)) {
			throw new Error(
				`Invalid bcrypt hash format: ${hash.substring(0, 10)}...`,
			);
		}

		logger.info(`✅ Cryptographic setup verified (salt rounds: ${saltRounds})`);
	} catch (error: any) {
		logger.error("❌ CRITICAL: Cryptographic setup verification failed!");
		logger.error(error.message);
		logger.error(
			"Server cannot start with invalid cryptographic configuration",
		);
		throw error;
	}
}

/**
 * Verify JWT configuration
 */
export function verifyJWTSetup(): void {
	logger.info("🔑 Verifying JWT configuration...");

	const isDevelopment = env.NODE_ENV === "development";
	logger.info(
		`🌐 Environment: ${env.NODE_ENV} (isDevelopment: ${isDevelopment})`,
	);

	// Check JWT_ACCESS_SECRET
	if (!env.JWT_ACCESS_SECRET) {
		throw new Error("JWT_ACCESS_SECRET is required");
	}

	if (env.JWT_ACCESS_SECRET.length < 32) {
		if (isDevelopment || env.NODE_ENV !== "production") {
			logger.warn(
				`⚠️  JWT_ACCESS_SECRET is short (${env.JWT_ACCESS_SECRET.length} chars) - acceptable in ${env.NODE_ENV}`,
			);
		} else {
			throw new Error(
				"JWT_ACCESS_SECRET must be at least 32 characters in production",
			);
		}
	}

	// Check JWT_REFRESH_SECRET
	if (!env.JWT_REFRESH_SECRET) {
		throw new Error("JWT_REFRESH_SECRET is required");
	}

	if (env.JWT_REFRESH_SECRET.length < 32) {
		if (isDevelopment || env.NODE_ENV !== "production") {
			logger.warn(
				`⚠️  JWT_REFRESH_SECRET is short (${env.JWT_REFRESH_SECRET.length} chars) - acceptable in ${env.NODE_ENV}`,
			);
		} else {
			throw new Error(
				"JWT_REFRESH_SECRET must be at least 32 characters in production",
			);
		}
	}

	// Check that secrets are different
	if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
		throw new Error(
			"JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different",
		);
	}

	logger.info("✅ JWT configuration verified");
}

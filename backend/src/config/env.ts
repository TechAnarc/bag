import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	PORT: z.string().default("4000"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	DATABASE_URL: z.string(),
	JWT_ACCESS_SECRET: z.string(),
	JWT_REFRESH_SECRET: z.string(),
	JWT_ACCESS_EXPIRY: z.string().default("15m"),
	JWT_REFRESH_EXPIRY: z.string().default("7d"),
	BCRYPT_SALT_ROUNDS: z
		.string()
		.default("12")
		.transform((v) => parseInt(v, 10)),
	CORS_ORIGIN: z.string().default("http://localhost:5173"),
	CORS_ALLOWED_ORIGINS: z.string().optional(),
	ADMIN_EMAIL: z.string().email(),
	ADMIN_PASSWORD: z.string().min(8),
	ADMIN_NAME: z.string().default("Super Admin"),
	ADMIN_ROLE: z.enum(["SUPER_ADMIN", "ADMIN"]).default("SUPER_ADMIN"),
	ADMIN_JWT_SECRET: z.string(),
	ADMIN_JWT_EXPIRES_IN: z.string().default("24h"),
	REDIS_URL: z.string().optional(),

	// Supabase Configuration
	SUPABASE_URL: z.string().optional(),
	SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

	// OTP Configuration
	OTP_EXPIRY_MINUTES: z
		.string()
		.default("5")
		.transform((v) => parseInt(v)),
	OTP_MAX_ATTEMPTS: z
		.string()
		.default("5")
		.transform((v) => parseInt(v)),
	OTP_RESEND_COOLDOWN_SECONDS: z
		.string()
		.default("30")
		.transform((v) => parseInt(v)),
	OTP_MAX_RESEND_PER_HOUR: z
		.string()
		.default("3")
		.transform((v) => parseInt(v)),
	OTP_LENGTH: z
		.string()
		.default("6")
		.transform((v) => parseInt(v)),
	STRICT_AUTH_LOGGING: z
		.string()
		.default("true")
		.transform((v) => v === "true"),

	// SMTP Configuration
	SMTP_HOST: z.string().optional(),
	SMTP_PORT: z
		.string()
		.optional()
		.transform((v) => (v ? parseInt(v) : 587)),
	SMTP_USER: z.string().optional(),
	SMTP_PASS: z.string().optional(),
	SMTP_FROM_EMAIL: z.string().optional(),
	SMTP_FROM_NAME: z.string().optional().default("Bombay Bag House"),

	// Razorpay Configuration
	RAZORPAY_KEY_ID: z.string().optional(),
	RAZORPAY_KEY_SECRET: z.string().optional(),
	RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

	// Frontend URL
	FRONTEND_URL: z.string().default("http://localhost:5173"),

	// Backend URL (used for qualifying image paths)
	BACKEND_URL: z.string().default("http://localhost:8080"),

	// Google OAuth
	GOOGLE_CLIENT_ID: z.string().optional(),

	// Supabase Identity Resilience Engine
	SUPABASE_ANON_KEY: z.string().optional(),
	SUPABASE_JWT_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
	console.error("❌ CRITICAL: Environment validation failed!");
	console.error("The following variables are missing or invalid:");
	const errors = _env.error.format();
	Object.keys(errors).forEach((key) => {
		if (key !== "_errors") {
			console.error(`- ${key}: ${(errors as any)[key]?._errors.join(", ")}`);
		}
	});
	process.exit(1);
}

export const env = _env.data;

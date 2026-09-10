import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";
import { env } from "./env";

const getSanitizedUrl = (url: string) => {
	let sanitized = url.trim();

	// RENDER FIX: Render doesn't support IPv6. The "db.project.supabase.co" hostname is often IPv6-only.
	// We MUST use the Supabase Pooler hostname which supports IPv4.
	if (sanitized.includes("db.obndverrhnewlcapkxam.supabase.co")) {
		logger.warn(
			"⚠️ [DB] Detected Direct Hostname (likely IPv6-only). Redirecting to IPv4 Pooler...",
		);
		sanitized = sanitized.replace(
			"db.obndverrhnewlcapkxam.supabase.co:5432",
			"aws-1-ap-south-1.pooler.supabase.com:6543",
		);
		sanitized = sanitized.replace(
			"db.obndverrhnewlcapkxam.supabase.co",
			"aws-1-ap-south-1.pooler.supabase.com",
		);
		// Ensure port is correct for pooler
		if (!sanitized.includes(":6543")) {
			sanitized = sanitized.replace(":5432", ":6543");
		}
	}

	// Ensure Transaction Mode params
	if (sanitized.includes("pooler.supabase.com")) {
		if (!sanitized.includes("pgbouncer=true")) {
			sanitized += (sanitized.includes("?") ? "&" : "?") + "pgbouncer=true";
		}
		if (!sanitized.includes("sslmode=")) {
			sanitized += (sanitized.includes("?") ? "&" : "?") + "sslmode=require";
		}
	}
	return sanitized;
};

const rawUrl = getSanitizedUrl(env.DATABASE_URL);
const maskedUrl = rawUrl.replace(/:([^@]+)@/, ":****@");
logger.info(`🔌 Connection Target: ${maskedUrl}`);

const prisma = new PrismaClient({
	log: [
		{ emit: "event", level: "error" },
		{ emit: "event", level: "info" },
		{ emit: "event", level: "warn" },
	],
	datasources: {
		db: {
			url: rawUrl,
		},
	},
	// Add connection timeouts to prevent hanging
	errorFormat: "minimal",
});

prisma.$on("error", (e: any) => {
	logger.error(e.message);
});

export { prisma };
export default prisma;

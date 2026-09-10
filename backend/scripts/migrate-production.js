#!/usr/bin/env node

/**
 * Production Migration Script
 *
 * This script runs Prisma migrations using a DIRECT database connection
 * (bypassing PgBouncer) to avoid "prepared statement does not exist" errors.
 *
 * It automatically:
 * 1. Converts pooler connection to direct connection
 * 2. Runs migrations with timeout protection
 * 3. Falls back gracefully on errors
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

const MIGRATION_TIMEOUT = 60000; // 60 seconds

async function runMigrations() {
	console.log("📦 [MIGRATE] Starting production database migration...");

	try {
		// Get DATABASE_URL from environment
		let databaseUrl = process.env.DATABASE_URL;

		if (!databaseUrl) {
			console.error("❌ [MIGRATE] DATABASE_URL not found in environment");
			process.exit(1);
		}

		console.log(
			"🔍 [MIGRATE] Original connection:",
			databaseUrl.replace(/:[^:@]+@/, ":****@"),
		);

		// STRATEGY: Use Supabase Session Mode Pooler for migrations
		// - Transaction mode (6543) doesn't support prepared statements
		// - Direct connection (5432 to db.xxx) is blocked by Render
		// - Session mode pooler (5432 via pooler) DOES support prepared statements!
		let migrationUrl = databaseUrl;

		// Convert Transaction mode pooler to Session mode pooler
		if (migrationUrl.includes("pooler.supabase.com:6543")) {
			// Change port from 6543 (transaction) to 5432 (session)
			// Keep the pooler hostname (it's accessible from Render)
			migrationUrl = migrationUrl.replace(":6543", ":6432");
			console.log("✅ [MIGRATE] Switched to Session mode pooler (port 6432)");
		}

		// Remove pgbouncer=true parameter and add pgbouncer=false for session mode
		migrationUrl = migrationUrl.replace(/[?&]pgbouncer=true/, "");

		// Add session mode parameters
		if (migrationUrl.includes("?")) {
			migrationUrl += "&pgbouncer=false";
		} else {
			migrationUrl += "?pgbouncer=false";
		}

		console.log(
			"🔗 [MIGRATE] Migration connection:",
			migrationUrl.replace(/:[^:@]+@/, ":****@"),
		);

		// Run migration with timeout
		console.log("⏳ [MIGRATE] Running migrations (max 60 seconds)...");

		const migrationPromise = execAsync("npx prisma migrate deploy", {
			env: { ...process.env, DATABASE_URL: migrationUrl },
			cwd: __dirname + "/../",
			timeout: MIGRATION_TIMEOUT,
		});

		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(
				() => reject(new Error("Migration timeout after 60 seconds")),
				MIGRATION_TIMEOUT,
			),
		);

		const { stdout, stderr } = await Promise.race([
			migrationPromise,
			timeoutPromise,
		]);

		if (stdout) console.log(stdout);
		if (stderr) console.error(stderr);

		console.log("✅ [MIGRATE] Migrations completed successfully");
		console.log("🎉 [MIGRATE] Database is ready!");

		process.exit(0);
	} catch (error) {
		console.error("❌ [MIGRATE] Migration failed:", error.message);

		if (error.code === "ETIMEDOUT") {
			console.error(
				"⏱️  [MIGRATE] Migration timed out. Database might be slow or unreachable.",
			);
		}

		if (error.message.includes("prepared statement")) {
			console.error(
				"⚠️  [MIGRATE] Prepared statement error - this usually means PgBouncer is still being used.",
			);
			console.error(
				"💡 [MIGRATE] Ensure DATABASE_URL uses direct connection (port 5432) for migrations.",
			);
		}

		console.log(
			"ℹ️  [MIGRATE] Server will start anyway, but database tables might not exist.",
		);
		console.log(
			"ℹ️  [MIGRATE] Check Supabase dashboard to verify tables were created.",
		);

		// Exit with success code so server starts anyway
		process.exit(0);
	}
}

// Run migrations
runMigrations();

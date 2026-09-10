#!/usr/bin/env node
/**
 * Production Environment Safety Guard
 * Prevents destructive database operations in production
 */

const fs = require("fs");
const path = require("path");

function checkEnvironment() {
	try {
		// Read .env file
		const envPath = path.join(__dirname, "..", ".env");
		if (!fs.existsSync(envPath)) {
			console.warn("⚠️  No .env file found. Proceeding with caution...");
			return true;
		}

		const envContent = fs.readFileSync(envPath, "utf8");

		// Check NODE_ENV
		const nodeEnvMatch = envContent.match(/NODE_ENV\s*=\s*(\w+)/);
		if (nodeEnvMatch && nodeEnvMatch[1] === "production") {
			console.error("\n╔════════════════════════════════════════════════╗");
			console.error("║  ⛔ DANGER: PRODUCTION ENVIRONMENT DETECTED  ⛔ ║");
			console.error("╚════════════════════════════════════════════════╝\n");
			console.error("This operation will DELETE ALL DATA in your database!");
			console.error("It should NEVER be run in production.\n");
			console.error("If this is a development environment,");
			console.error('change NODE_ENV to "development" in .env\n');
			process.exit(1);
		}

		// Check DATABASE_URL for production indicators
		const dbUrlMatch = envContent.match(
			/DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/,
		);
		if (dbUrlMatch) {
			const dbUrl = dbUrlMatch[1];
			const productionIndicators = [
				"prod",
				"production",
				"amazonaws.com",
				"azure.com",
				"render.com",
				"railway.app",
				"planetscale.com",
				"supabase.co",
				"neon.tech",
			];

			for (const indicator of productionIndicators) {
				if (dbUrl.toLowerCase().includes(indicator)) {
					console.error("\n╔════════════════════════════════════════════════╗");
					console.error("║  ⛔ PRODUCTION DATABASE DETECTED  ⛔          ║");
					console.error("╚════════════════════════════════════════════════╝\n");
					console.error(
						"Your DATABASE_URL appears to point to a production database!",
					);
					console.error("This operation will DELETE ALL DATA!\n");
					console.error(`Detected indicator: ${indicator}\n`);
					process.exit(1);
				}
			}
		}

		// Check for localhost/127.0.0.1 (good sign for dev)
		if (dbUrlMatch) {
			const dbUrl = dbUrlMatch[1];
			if (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")) {
				console.log("✓ Development environment confirmed (localhost database)");
				return true;
			}
		}

		console.log("✓ Environment check passed");
		return true;
	} catch (error) {
		console.error("Error checking environment:", error.message);
		console.error("Proceeding with caution...");
		return true;
	}
}

// Run the check
checkEnvironment();

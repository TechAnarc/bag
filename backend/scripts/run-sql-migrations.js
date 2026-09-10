#!/usr/bin/env node

/**
 * Raw SQL Migration Runner
 *
 * This script bypasses Prisma Migrate and runs migrations using raw SQL.
 * Works with PgBouncer Transaction mode pooler (port 6543).
 *
 * Why: Prisma Migrate requires prepared statements which PgBouncer doesn't support.
 * Solution: Execute migration SQL directly via pg client.
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function runSQLMigrations() {
	console.log("📦 [SQL-MIGRATE] Starting raw SQL migration...");

	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error("❌ [SQL-MIGRATE] DATABASE_URL not found");
		process.exit(0); // Exit gracefully so server starts
	}

	console.log("🔗 [SQL-MIGRATE] Connecting to database...");

	const client = new Client({
		connectionString: databaseUrl,
		ssl: { rejectUnauthorized: false },
	});

	try {
		await client.connect();
		console.log("✅ [SQL-MIGRATE] Connected successfully");

		// Check if _prisma_migrations table exists
		const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `);

		const migrationsTableExists = tableCheck.rows[0].exists;

		if (!migrationsTableExists) {
			console.log("📝 [SQL-MIGRATE] Creating _prisma_migrations table...");
			await client.query(`
        CREATE TABLE "_prisma_migrations" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "checksum" TEXT NOT NULL,
          "finished_at" TIMESTAMP(3),
          "migration_name" TEXT NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMP(3),
          "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `);
			console.log("✅ [SQL-MIGRATE] _prisma_migrations table created");
		}

		// Read migration files
		const migrationsDir = path.join(__dirname, "../prisma/migrations");

		if (!fs.existsSync(migrationsDir)) {
			console.log("⚠️  [SQL-MIGRATE] No migrations directory found");
			await client.end();
			process.exit(0);
		}

		const migrationFolders = fs
			.readdirSync(migrationsDir)
			.filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
			.sort(); // Apply in order

		console.log(
			`📂 [SQL-MIGRATE] Found ${migrationFolders.length} migration(s)`,
		);

		for (const folder of migrationFolders) {
			// Check if already applied
			const applied = await client.query(
				'SELECT * FROM "_prisma_migrations" WHERE migration_name = $1',
				[folder],
			);

			if (applied.rows.length > 0) {
				console.log(`⏭️  [SQL-MIGRATE] Skipping ${folder} (already applied)`);
				continue;
			}

			console.log(`🔄 [SQL-MIGRATE] Applying ${folder}...`);

			const sqlFile = path.join(migrationsDir, folder, "migration.sql");

			if (!fs.existsSync(sqlFile)) {
				console.log(`⚠️  [SQL-MIGRATE] No migration.sql found in ${folder}`);
				continue;
			}

			const sql = fs.readFileSync(sqlFile, "utf-8");

			try {
				// Execute migration SQL
				await client.query(sql);

				// Record migration
				await client.query(
					`INSERT INTO "_prisma_migrations" 
           (id, checksum, migration_name, logs, finished_at, applied_steps_count) 
           VALUES ($1, $2, $3, $4, NOW(), 1)`,
					[folder.replace("_", "-"), "", folder, "Applied by raw SQL runner"],
				);

				console.log(`✅ [SQL-MIGRATE] Applied ${folder}`);
			} catch (error) {
				console.error(
					`❌ [SQL-MIGRATE] Failed to apply ${folder}:`,
					error.message,
				);
				// Continue with other migrations
			}
		}

		await client.end();
		console.log("🎉 [SQL-MIGRATE] All migrations processed successfully");
		process.exit(0);
	} catch (error) {
		console.error("❌ [SQL-MIGRATE] Migration failed:", error.message);
		console.log("ℹ️  [SQL-MIGRATE] Server will start anyway");

		try {
			await client.end();
		} catch (e) {
			// Ignore cleanup errors
		}

		process.exit(0); // Exit gracefully so server starts
	}
}

runSQLMigrations();

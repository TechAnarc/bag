#!/usr/bin/env node

/**
 * Render Production Database Setup
 * Run this ONCE after deploying to Render to set up the database
 */

const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function setupRenderDatabase() {
	console.log("🚀 [RENDER-SETUP] Starting production database setup...");

	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error("❌ [RENDER-SETUP] DATABASE_URL not found");
		process.exit(1);
	}

	console.log("🔗 [RENDER-SETUP] Connecting to database...");

	const client = new Client({
		connectionString: databaseUrl,
		ssl: { rejectUnauthorized: false },
	});

	try {
		await client.connect();
		console.log("✅ [RENDER-SETUP] Connected successfully");

		// Check if Admin table exists
		const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Admin'
            );
        `);

		if (!tableCheck.rows[0].exists) {
			console.log("❌ [RENDER-SETUP] Admin table does not exist!");
			console.log(
				"📦 [RENDER-SETUP] Please run: npx prisma db push --accept-data-loss",
			);
			process.exit(1);
		}

		console.log("✅ [RENDER-SETUP] Admin table exists");

		// Check if super admin exists
		const adminEmail = process.env.ADMIN_EMAIL;
		const password = process.env.ADMIN_PASSWORD;
		if (!adminEmail || !password) {
			console.error("❌ [RENDER-SETUP] ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
			await client.end();
			process.exit(1);
		}
		const adminCheck = await client.query(
			'SELECT * FROM "Admin" WHERE email = $1',
			[adminEmail],
		);

		if (adminCheck.rows.length > 0) {
			console.log(
				"✅ [RENDER-SETUP] Super admin already exists, updating password...",
			);

			// Always update password hash to match current env var
			const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
			const passwordHash = await bcrypt.hash(password, saltRounds);

			await client.query(
				'UPDATE "Admin" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2',
				[passwordHash, adminEmail],
			);

			console.log(
				"✅ [RENDER-SETUP] Super admin password updated successfully",
			);
			console.log(`   Email: ${adminEmail}`);
			await client.end();
			process.exit(0);
		}

		console.log("📝 [RENDER-SETUP] Creating super admin...");

		// Hash password
		const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
		const passwordHash = await bcrypt.hash(password, saltRounds);

		// Create super admin
		await client.query(
			`
            INSERT INTO "Admin" (
                id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt"
            ) VALUES (
                gen_random_uuid()::text,
                $1,
                $2,
                $3,
                'SUPER_ADMIN',
                true,
                NOW(),
                NOW()
            )
        `,
			[adminEmail, process.env.ADMIN_NAME || "Super Admin", passwordHash],
		);

		console.log("✅ [RENDER-SETUP] Super admin created successfully");
		console.log(`   Email: ${adminEmail}`);

		await client.end();
		console.log("🎉 [RENDER-SETUP] Setup completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ [RENDER-SETUP] Setup failed:", error.message);
		console.error(error.stack);

		try {
			await client.end();
		} catch (e) {
			// Ignore cleanup errors
		}

		process.exit(1);
	}
}

setupRenderDatabase();

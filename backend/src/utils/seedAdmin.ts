import { prisma } from "../config/database";
import { env } from "../config/env";
import bcrypt from "bcryptjs";
import { logger } from "../config/logger";

export async function seedSuperAdmin() {
	try {
		// Check if Admin table exists before attempting seed
		const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Admin'
      );
    `.catch(() => [{ exists: false }]);

		if (!tableExists || !tableExists[0]?.exists) {
			logger.warn(
				"⚠️  Admin table does not exist yet. Skipping seed. Run migrations first.",
			);
			return;
		}

		const adminEmail = env.ADMIN_EMAIL;
		const adminPassword = env.ADMIN_PASSWORD;
		const adminName = env.ADMIN_NAME;
		const adminRole = env.ADMIN_ROLE;

		const existingAdmin = await prisma.admin.findUnique({
			where: { email: adminEmail },
		});

		if (existingAdmin) {
			// Update existing admin to match .env (useful for password updates)
			const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
			const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

			await prisma.admin.update({
				where: { id: existingAdmin.id },
				data: {
					name: adminName,
					passwordHash,
					role: adminRole,
				},
			});
			logger.info(`✅ Super Admin updated successfully: ${adminEmail}`);
			await seedNotificationTemplates();
			return;
		}

		const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
		const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

		await prisma.admin.create({
			data: {
				name: adminName,
				email: adminEmail,
				passwordHash,
				role: adminRole,
				isActive: true,
			},
		});

		logger.info(`✨ Super Admin created successfully: ${adminEmail}`);

		await seedNotificationTemplates();
	} catch (error) {
		logger.warn(
			"⚠️  Failed to seed Super Admin (tables may not exist yet):",
			error,
		);
	}
}

async function seedNotificationTemplates() {
	const templates = [
		{
			name: "ORDER_RECEIVED",
			subject: "🛍️ New Order Received: #{{orderNumber}}",
			content:
				"You have a new order of ₹{{amount}} from {{customerName}}. Check the dashboard for details.",
			isActive: true,
			platform: "PUSH" as any,
		},
		{
			name: "NEW_REVIEW",
			subject: "⭐ New Product Review",
			content:
				"{{author}} just left a {{rating}}-star review for {{productName}}.",
			isActive: true,
			platform: "PUSH" as any,
		},
		{
			name: "NEW_INQUIRY",
			subject: "📩 New Customer Inquiry: {{subject}}",
			content: "New message from {{sender}}: {{message}}",
			isActive: true,
			platform: "PUSH" as any,
		},
	];

	for (const t of templates) {
		await prisma.notificationTemplate.upsert({
			where: { name: t.name },
			update: t,
			create: t,
		});
	}
	logger.info("✅ Notification templates synchronized.");
}

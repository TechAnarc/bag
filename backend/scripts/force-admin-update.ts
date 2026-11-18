import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

async function main() {
	dotenv.config({ path: path.join(__dirname, "../.env") });
	const prisma = new PrismaClient();

	const email = process.env.ADMIN_EMAIL;
	const password = process.env.ADMIN_PASSWORD;
	if (!email || !password) {
		console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
		process.exit(1);
	}
	const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");

	console.log(`Updating admin ${email} with password from .env...`);

	try {
		const passwordHash = await bcrypt.hash(password, saltRounds);

		const admin = await prisma.admin.upsert({
			where: { email },
			update: {
				passwordHash,
				isActive: true,
			},
			create: {
				email,
				name: process.env.ADMIN_NAME || "Super Admin",
				passwordHash,
				role: (process.env.ADMIN_ROLE as any) || "SUPER_ADMIN",
				isActive: true,
			},
		});

		console.log(`✅ Admin updated/created successfully: ${admin.email}`);
	} catch (error) {
		console.error("❌ Error updating admin:", error);
	} finally {
		await prisma.$disconnect();
	}
}

main();

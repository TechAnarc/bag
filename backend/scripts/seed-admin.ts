import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
	try {
		console.log("🔧 Creating Super Admin...");

		const email = process.env.ADMIN_EMAIL;
		const password = process.env.ADMIN_PASSWORD;
		if (!email || !password) {
			throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
		}
		const name = process.env.ADMIN_NAME || "Super Admin";
		const role =
			(process.env.ADMIN_ROLE as "SUPER_ADMIN" | "ADMIN") || "SUPER_ADMIN";

		// Check if admin already exists
		const existingAdmin = await prisma.admin.findUnique({
			where: { email },
		});

		if (existingAdmin) {
			console.log(`✅ Super Admin already exists: ${email}`);
			return;
		}

		// Hash password
		const saltRounds = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
		const passwordHash = await bcrypt.hash(password, saltRounds);

		// Create super admin
		const admin = await prisma.admin.create({
			data: {
				name,
				email,
				passwordHash,
				role,
				isActive: true,
			},
		});

		console.log(`✅ Super Admin created successfully!`);
		console.log(`📧 Email: ${admin.email}`);
		console.log(`👤 Name: ${admin.name}`);
		console.log(`🔐 Role: ${admin.role}`);
	} catch (error) {
		console.error("❌ Error creating Super Admin:", error);
		throw error;
	}
}

async function main() {
	console.log("🌱 Seeding database...\n");

	await createSuperAdmin();

	console.log("\n✅ Seeding completed successfully!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

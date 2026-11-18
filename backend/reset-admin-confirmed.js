const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const prisma = new PrismaClient();

async function resetAdmin() {
	const email = process.env.ADMIN_EMAIL;
	const password = process.env.ADMIN_PASSWORD;
	if (!email || !password) {
		console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
		process.exit(1);
	}
	const saltRounds = 12;
	const passwordHash = await bcrypt.hash(password, saltRounds);

	console.log("Resetting Admin:", email);

	try {
		await prisma.admin.upsert({
			where: { email },
			update: {
				passwordHash,
				isActive: true,
				role: "SUPER_ADMIN",
			},
			create: {
				email,
				name: "Super Admin",
				passwordHash,
				isActive: true,
				role: "SUPER_ADMIN",
			},
		});
		console.log("✅ Admin reset successful!");
	} catch (error) {
		console.error("❌ Reset failed:", error);
	} finally {
		await prisma.$disconnect();
	}
}

resetAdmin();

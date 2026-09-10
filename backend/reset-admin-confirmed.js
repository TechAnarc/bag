const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function resetAdmin() {
	const email = "mahakal.mahakali014@gmail.com";
	const password = "Kali@0786";
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

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAdmins() {
	try {
		const admins = await prisma.admin.findMany();
		console.log(`📊 Admins in DB: ${admins.length}`);
		if (admins.length > 0) {
			console.log(
				"Admin emails:",
				admins.map((a) => a.email),
			);
		} else {
			console.log("No admins found.");
		}
	} catch (error) {
		console.error("❌ Error checking admins:", error.message);
	} finally {
		await prisma.$disconnect();
	}
}

checkAdmins();

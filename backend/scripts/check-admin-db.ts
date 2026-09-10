import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkAdmin() {
	try {
		const admin = await prisma.admin.findFirst();
		if (admin) {
			console.log("Admin found:");
			console.log(`- Email: ${admin.email}`);
			console.log(`- Role: ${admin.role}`);
			console.log(`- Active: ${admin.isActive}`);
		} else {
			console.log("No admin found in database.");
		}
	} catch (error) {
		console.error("Error checking admin:", error);
	} finally {
		await prisma.$disconnect();
	}
}

checkAdmin();

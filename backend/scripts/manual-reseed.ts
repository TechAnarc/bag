import { seedSuperAdmin } from "../src/utils/seedAdmin";
import { prisma } from "../src/config/database";

async function runSeed() {
	console.log("🚀 Starting manual re-seed...");
	await seedSuperAdmin();
	console.log("✅ Re-seed complete.");
	await prisma.$disconnect();
}

runSeed();

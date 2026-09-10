const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	const admins = await prisma.admin.findMany();
	console.log(
		"Admins found:",
		admins.map((a) => ({ email: a.email, isActive: a.isActive, role: a.role })),
	);
	await prisma.$disconnect();
}

main();

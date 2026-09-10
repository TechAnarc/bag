const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	console.log("Prisma Models:");
	const keys = Object.keys(prisma);
	keys
		.filter(
			(k) => !k.startsWith("_") && !k.startsWith("$") && k !== "constructor",
		)
		.forEach((k) => {
			console.log(k);
		});
}

main().finally(() => prisma.$disconnect());

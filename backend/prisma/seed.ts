import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seeding...");

	try {
		const csvFilePath = path.join(__dirname, "../data/sample_products.csv");

		if (!fs.existsSync(csvFilePath)) {
			console.warn("⚠️ No products CSV found. Skipping product seeding.");
			return;
		}

		const fileContent = fs.readFileSync(csvFilePath, "utf-8");
		const records = parse(fileContent, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		});

		console.log(`📑 Processing ${records.length} product records...`);

		for (const record of records) {
			await prisma.product.upsert({
				where: { id: record.id || "placeholder-id" }, // This assumes we might have IDs, but usually we don't for new CSVs
				update: {},
				create: {
					name: record.name,
					category: record.category,
					subCategory: record.subCategory || null,
					description: record.description || null,
					price: parseFloat(record.price) || 0,
					stockQuantity: parseInt(record.stockQuantity, 10) || 0,
					material: record.material || null,
					isActive: true,
				},
			});
		}

		console.log("✅ Seeding completed successfully.");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();

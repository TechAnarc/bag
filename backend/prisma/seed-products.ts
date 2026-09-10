import { PrismaClient, ProductStatus } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

const categories = [
	"Anklets",
	"Bangles",
	"Rings",
	"Kada",
	"Men's Ring",
	"Men's Chain",
	"Mala",
	"Men's Bracelets",
	"Rudraksh",
	"Mangalsutra",
	"Necklace Set",
	"Antique Necklace",
	"Ladies Bracelets",
	"Ladies Chain",
];

const platingTypes = [
	"1 Gram Gold Plated",
	"Premium Gold Finish",
	"Antique Gold Plated",
	"Rose Gold Plated",
];
const materials = ["Brass", "Copper", "Alloy"];
const occasions = ["Wedding", "Festival", "Daily Wear", "Party", "Gift"];

async function main() {
	console.log("🌱 Starting detailed database seeding...");

	for (const catName of categories) {
		const catSlug = catName.toLowerCase().replace(/ /g, "-").replace(/'/g, "");
		const category = await prisma.category.upsert({
			where: { slug: catSlug },
			update: { name: catName },
			create: {
				name: catName,
				slug: catSlug,
				isActive: true,
			},
		});

		console.log(`📂 Category: ${catName} seeded.`);

		let catIdx = categories.indexOf(catName);
		// Seed 40 products per category
		for (let i = 1; i <= 40; i++) {
			const productName = `${catName} Design ${i}`;
			const slug = slugify(
				`${catName} ${i} ${Math.random().toString(36).substring(7)}`,
				{ lower: true },
			);
			const sku = `TRV-${catSlug.replace(/-/g, "").substring(0, 4).toUpperCase()}-${catIdx}${1000 + i}`;
			const price = Math.floor(Math.random() * 2000) + 500;

			await prisma.product.create({
				data: {
					name: productName,
					slug: slug,
					sku: sku,
					categoryId: category.id,
					price: price,
					discountPrice: price - Math.floor(Math.random() * 200),
					gstIncluded: true,
					platingType:
						platingTypes[Math.floor(Math.random() * platingTypes.length)],
					shortTagline: "Designed to celebrate your unique elegance",
					description:
						"This elegant piece is crafted with precision to provide a premium look and feel. Perfect for any special occasion.",
					images: [`https://picsum.photos/seed/${slug}/600/800`],
					thumbnail: `https://picsum.photos/seed/${slug}/300/400`,
					specifications: {
						weight: `${Math.floor(Math.random() * 50) + 10}g`,
						material: materials[Math.floor(Math.random() * materials.length)],
						surfaceFinish: "Polished",
						occasion: occasions[Math.floor(Math.random() * occasions.length)],
						brand: "Triveni Jewellers",
						packageContents: `1 ${catName}`,
					},
					inventory: {
						quantity: 50,
						inStock: true,
					},
					seo: {
						metaTitle: `${productName} | Triveni Jewellers`,
						metaDescription: `Buy premium ${productName} at best price.`,
					},
					status: ProductStatus.ACTIVE,
					isActive: true,
				},
			});
		}
		console.log(`✅ 40 products seeded for ${catName}.`);
	}

	console.log("🚀 Seeding completed successfully.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

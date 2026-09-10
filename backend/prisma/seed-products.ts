import { PrismaClient, ProductStatus } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

const categories = [
	"Tote Bags",
	"Handbags",
	"Backpacks",
	"Laptop Bags",
	"Travel Bags",
	"Sling Bags",
	"Wallets",
	"Duffel Bags",
	"Clutches",
	"School Bags",
];

const materials = [
	"Full-grain Leather",
	"Saffiano Leather",
	"Waxed Canvas",
	"Ballistic Nylon",
	"Vegan Leather",
	"Polycarbonate",
];

const bagSamples = [
	{ name: "Noir Saffiano Tote", cat: "Tote Bags", price: 4490, mrp: 5990, mat: "Saffiano Leather", cap: "18L", color: "Black" },
	{ name: "Cognac Executive Messenger", cat: "Laptop Bags", price: 5890, mrp: 7490, mat: "Full-grain Leather", cap: "15L", color: "Cognac" },
	{ name: "Aurum Cabin Trolley 20\"", cat: "Travel Bags", price: 8990, mrp: 11990, mat: "Polycarbonate", cap: "38L", color: "Champagne" },
	{ name: "Heritage Atlas Backpack", cat: "Backpacks", price: 3690, mrp: 4990, mat: "Waxed Canvas", cap: "24L", color: "Olive" },
	{ name: "Aurora Crossbody Sling", cat: "Sling Bags", price: 2490, mrp: 3290, mat: "Vegan Leather", cap: "5L", color: "Blush" },
	{ name: "Onyx Wallet Bifold", cat: "Wallets", price: 1290, mrp: 1690, mat: "Pebbled Leather", cap: "0.5L", color: "Black" },
	{ name: "Voyager Duffel 45L", cat: "Duffel Bags", price: 3290, mrp: 4490, mat: "Ballistic Nylon", cap: "45L", color: "Charcoal" },
	{ name: "Signature Gold Evening Clutch", cat: "Clutches", price: 6990, mrp: 8990, mat: "Metallic Leather", cap: "2L", color: "Gold" },
	{ name: "Junior Pro Ergonomic Schoolbag", cat: "School Bags", price: 1890, mrp: 2490, mat: "Recycled Polyester", cap: "20L", color: "Navy" },
	{ name: "Pebble Hobo Shoulder Bag", cat: "Handbags", price: 3990, mrp: 5290, mat: "Pebbled Leather", cap: "12L", color: "Camel" },
];

async function main() {
	console.log("🌱 Starting bag database seeding...");

	const catMap = new Map<string, string>();
	for (const catName of categories) {
		const catSlug = catName.toLowerCase().replace(/ /g, "-").replace(/'/g, "");
		const category = await prisma.category.upsert({
			where: { slug: catSlug },
			update: { name: catName, isActive: true },
			create: {
				name: catName,
				slug: catSlug,
				isActive: true,
			},
		});
		catMap.set(catName, category.id);
		console.log(`📂 Category: ${catName} seeded.`);
	}

	for (const bag of bagSamples) {
		const categoryId = catMap.get(bag.cat);
		if (!categoryId) continue;

		const slug = slugify(bag.name, { lower: true, strict: true });
		const sku = `BBH-${bag.cat.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

		await prisma.product.upsert({
			where: { slug },
			update: {
				name: bag.name,
				categoryId,
				price: bag.price,
				basePrice: bag.mrp,
				sellingPrice: bag.price,
				ownerPrice: Math.round(bag.price * 0.6),
				gstIncluded: true,
				shortTagline: `Handcrafted ${bag.name} in ${bag.mat}`,
				description: `Designed for everyday luxury and timeless durability. Crafted with premium ${bag.mat}.`,
				images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"],
				thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
				specifications: {
					material: bag.mat,
					capacity: bag.cap,
					color: bag.color,
					brand: "Bombay Bag House",
				},
				careInstructions: "Keep away from sharp objects and heat. Wipe with a clean, soft cloth. Store in dust bag.",
				badges: ["Handcrafted Luxury", "Premium Materials", "Everyday Durability", "Insured Shipping"],
				inventory: {
					quantity: 25,
					inStock: true,
				},
				seo: {
					metaTitle: `${bag.name} | Bombay Bag House`,
					metaDescription: `Discover the luxury ${bag.name} crafted for durability.`,
				},
				status: ProductStatus.ACTIVE,
				isActive: true,
			},
			create: {
				name: bag.name,
				slug,
				sku,
				categoryId,
				price: bag.price,
				basePrice: bag.mrp,
				sellingPrice: bag.price,
				ownerPrice: Math.round(bag.price * 0.6),
				gstIncluded: true,
				shortTagline: `Handcrafted ${bag.name} in ${bag.mat}`,
				description: `Designed for everyday luxury and timeless durability. Crafted with premium ${bag.mat}.`,
				images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"],
				thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
				specifications: {
					material: bag.mat,
					capacity: bag.cap,
					color: bag.color,
					brand: "Bombay Bag House",
				},
				careInstructions: "Keep away from sharp objects and heat. Wipe with a clean, soft cloth. Store in dust bag.",
				badges: ["Handcrafted Luxury", "Premium Materials", "Everyday Durability", "Insured Shipping"],
				inventory: {
					quantity: 25,
					inStock: true,
				},
				seo: {
					metaTitle: `${bag.name} | Bombay Bag House`,
					metaDescription: `Discover the luxury ${bag.name} crafted for durability.`,
				},
				status: ProductStatus.ACTIVE,
				isActive: true,
			},
		});
		console.log(`👜 Product: ${bag.name} seeded.`);
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

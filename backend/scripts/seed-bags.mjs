import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BAG_CATEGORIES = [
  { name: "Tote Bags", slug: "tote-bags", skuPrefix: "TOT", sortOrder: 1 },
  { name: "Handbags", slug: "handbags", skuPrefix: "HND", sortOrder: 2 },
  { name: "Backpacks", slug: "backpacks", skuPrefix: "BCK", sortOrder: 3 },
  { name: "Laptop Bags", slug: "laptop-bags", skuPrefix: "LPT", sortOrder: 4 },
  { name: "Travel Bags", slug: "travel-bags", skuPrefix: "TRV", sortOrder: 5 },
  { name: "Sling Bags", slug: "sling-bags", skuPrefix: "SLG", sortOrder: 6 },
  { name: "Wallets", slug: "wallets", skuPrefix: "WLT", sortOrder: 7 },
  { name: "Duffel Bags", slug: "duffel-bags", skuPrefix: "DUF", sortOrder: 8 },
  { name: "Clutches", slug: "clutches", skuPrefix: "CLT", sortOrder: 9 },
  { name: "School Bags", slug: "school-bags", skuPrefix: "SCH", sortOrder: 10 }
];

const SEED_PRODUCTS = [
  {
    name: "Noir Saffiano Tote",
    categorySlug: "tote-bags",
    sellingPrice: 4490,
    basePrice: 5990,
    ownerPrice: 2800,
    description: "A sculpted tote in saffiano leather with gold-tone hardware. Spacious enough for the day, refined enough for the evening.",
    shortTagline: "Handcrafted Luxury Tote in Saffiano Leather",
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"],
    quantity: 24,
    specifications: {
      material: "Saffiano Leather",
      capacity: "18L",
      dimensions: "35 x 28 x 14 cm",
      compartments: 3,
      closureType: "Zipper",
      strapType: "Double",
      laptopCompatible: true,
      waterResistant: true,
      color: "Black",
      brand: "TBH Maison"
    }
  },
  {
    name: "Cognac Executive Messenger",
    categorySlug: "laptop-bags",
    sellingPrice: 5890,
    basePrice: 7490,
    ownerPrice: 3600,
    description: "An executive messenger crafted in full-grain cognac leather. Padded laptop sleeve and an interior built for the modern professional.",
    shortTagline: "Full-Grain Leather Executive Laptop Bag",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"],
    quantity: 14,
    specifications: {
      material: "Full-grain Leather",
      capacity: "15L",
      dimensions: "40 x 30 x 10 cm",
      compartments: 4,
      closureType: "Buckle",
      strapType: "Adjustable Strap",
      laptopCompatible: true,
      waterResistant: false,
      color: "Cognac",
      brand: "TBH Atelier"
    }
  },
  {
    name: "Aurum Cabin Trolley 20\"",
    categorySlug: "travel-bags",
    sellingPrice: 8990,
    basePrice: 11990,
    ownerPrice: 5500,
    description: "Aircraft-grade polycarbonate shell, silent twin-spinner wheels, TSA lock. Engineered for the long road.",
    shortTagline: "Lightweight Aircraft Polycarbonate Cabin Trolley",
    images: ["https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&q=80"],
    quantity: 9,
    specifications: {
      material: "Polycarbonate",
      capacity: "38L",
      dimensions: "55 x 38 x 23 cm",
      compartments: 2,
      closureType: "Zipper with TSA Lock",
      strapType: "Telescopic Handle",
      laptopCompatible: true,
      waterResistant: true,
      color: "Champagne",
      brand: "TBH Voyager"
    }
  },
  {
    name: "Heritage Atlas Backpack",
    categorySlug: "backpacks",
    sellingPrice: 3690,
    basePrice: 4990,
    ownerPrice: 2200,
    description: "A waxed-canvas backpack with leather trims, magnetic snap closures and a dedicated 16\" laptop sleeve.",
    shortTagline: "Rugged Waxed Canvas All-Terrain Backpack",
    images: ["https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=800&q=80"],
    quantity: 32,
    specifications: {
      material: "Waxed Canvas",
      capacity: "24L",
      dimensions: "45 x 32 x 16 cm",
      compartments: 3,
      closureType: "Magnetic Snap",
      strapType: "Double Ergonomic",
      laptopCompatible: true,
      waterResistant: true,
      color: "Olive",
      brand: "TBH Heritage"
    }
  },
  {
    name: "Aurora Crossbody Sling",
    categorySlug: "sling-bags",
    sellingPrice: 2490,
    basePrice: 3290,
    ownerPrice: 1400,
    description: "An everyday crossbody in dusty blush with adjustable strap and dual interior compartments.",
    shortTagline: "Everyday Elegant Vegan Leather Sling",
    images: ["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80"],
    quantity: 41,
    specifications: {
      material: "Vegan Leather",
      capacity: "5L",
      dimensions: "24 x 18 x 8 cm",
      compartments: 2,
      closureType: "Zipper",
      strapType: "Removable Strap",
      laptopCompatible: false,
      waterResistant: true,
      color: "Blush",
      brand: "TBH Maison"
    }
  },
  {
    name: "Onyx Wallet Bifold",
    categorySlug: "wallets",
    sellingPrice: 1290,
    basePrice: 1690,
    ownerPrice: 700,
    description: "Slim bifold in pebbled leather. RFID-blocking, six card slots, two cash pockets.",
    shortTagline: "RFID Protected Pebbled Leather Bifold Wallet",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80"],
    quantity: 60,
    specifications: {
      material: "Pebbled Leather",
      capacity: "0.5L",
      dimensions: "11 x 9 x 2 cm",
      compartments: 6,
      closureType: "Bifold",
      strapType: "None",
      laptopCompatible: false,
      waterResistant: false,
      color: "Black",
      brand: "TBH Atelier"
    }
  },
  {
    name: "Voyager Duffel 45L",
    categorySlug: "duffel-bags",
    sellingPrice: 3290,
    basePrice: 4490,
    ownerPrice: 1900,
    description: "Weekend-ready duffel with shoe compartment, wet pocket and trolley sleeve.",
    shortTagline: "High-Capacity Ballistic Nylon Travel Duffel",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80"],
    quantity: 22,
    specifications: {
      material: "Ballistic Nylon",
      capacity: "45L",
      dimensions: "52 x 30 x 28 cm",
      compartments: 4,
      closureType: "Zipper",
      strapType: "Adjustable Strap",
      laptopCompatible: true,
      waterResistant: true,
      color: "Charcoal",
      brand: "TBH Voyager"
    }
  },
  {
    name: "Signature Gold Evening Clutch",
    categorySlug: "clutches",
    sellingPrice: 6990,
    basePrice: 8990,
    ownerPrice: 4100,
    description: "Hand-finished evening clutch with the TBH signature crest in 24k-plated brass.",
    shortTagline: "Artisan Handcrafted Metallic Leather Evening Clutch",
    images: ["https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80"],
    quantity: 6,
    specifications: {
      material: "Metallic Leather",
      capacity: "2L",
      dimensions: "22 x 14 x 5 cm",
      compartments: 1,
      closureType: "Magnetic Clasp",
      strapType: "Removable Chain",
      laptopCompatible: false,
      waterResistant: false,
      color: "Gold",
      brand: "TBH Signature"
    }
  },
  {
    name: "Junior Pro Ergonomic Schoolbag",
    categorySlug: "school-bags",
    sellingPrice: 1890,
    basePrice: 2490,
    ownerPrice: 950,
    description: "Ergonomic padded straps, reflective trims and a roomy main compartment with laptop sleeve.",
    shortTagline: "Spine-Support Recycled Polyester School Bag",
    images: ["https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=800&q=80"],
    quantity: 80,
    specifications: {
      material: "Recycled Polyester",
      capacity: "20L",
      dimensions: "42 x 30 x 18 cm",
      compartments: 4,
      closureType: "Zipper",
      strapType: "Double Padded",
      laptopCompatible: true,
      waterResistant: true,
      color: "Navy",
      brand: "TBH Kids"
    }
  },
  {
    name: "Pebble Hobo Shoulder Bag",
    categorySlug: "handbags",
    sellingPrice: 3990,
    basePrice: 5290,
    ownerPrice: 2400,
    description: "Slouchy hobo silhouette with a single rolled handle and suede-lined interior.",
    shortTagline: "Supple Pebbled Leather Everyday Shoulder Bag",
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"],
    quantity: 19,
    specifications: {
      material: "Pebbled Leather",
      capacity: "12L",
      dimensions: "32 x 26 x 12 cm",
      compartments: 2,
      closureType: "Magnetic",
      strapType: "Single Shoulder",
      laptopCompatible: false,
      waterResistant: false,
      color: "Camel",
      brand: "TBH Maison"
    }
  }
];

async function seed() {
  console.log("Seeding Bag Categories...");
  const catMap = new Map();
  for (const c of BAG_CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, skuPrefix: c.skuPrefix, sortOrder: c.sortOrder, isActive: true },
      create: { name: c.name, slug: c.slug, skuPrefix: c.skuPrefix, sortOrder: c.sortOrder, isActive: true }
    });
    catMap.set(c.slug, cat.id);
  }
  console.log(Created/updated  categories.);

  console.log("Seeding Bags into Prisma...");
  let count = 0;
  for (const p of SEED_PRODUCTS) {
    const categoryId = catMap.get(p.categorySlug);
    if (!categoryId) continue;
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const sku = BBH--;

    await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        categoryId,
        price: p.sellingPrice,
        basePrice: p.basePrice,
        sellingPrice: p.sellingPrice,
        ownerPrice: p.ownerPrice,
        description: p.description,
        shortTagline: p.shortTagline,
        images: p.images,
        thumbnail: p.images[0],
        status: "ACTIVE",
        isActive: true,
        specifications: p.specifications,
        inventory: { quantity: p.quantity, inStock: p.quantity > 0 }
      },
      create: {
        name: p.name,
        slug,
        sku,
        categoryId,
        price: p.sellingPrice,
        basePrice: p.basePrice,
        sellingPrice: p.sellingPrice,
        ownerPrice: p.ownerPrice,
        description: p.description,
        shortTagline: p.shortTagline,
        images: p.images,
        thumbnail: p.images[0],
        status: "ACTIVE",
        isActive: true,
        specifications: p.specifications,
        inventory: { quantity: p.quantity, inStock: p.quantity > 0 }
      }
    });
    count++;
  }
  console.log(Successfully seeded  bag products.);
  await prisma.();
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});

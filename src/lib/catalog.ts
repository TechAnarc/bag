import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";
import cWomen from "@/assets/cat-women.jpg";
import cOffice from "@/assets/cat-office.jpg";
import cSchool from "@/assets/cat-school.jpg";
import cTravel from "@/assets/cat-travel.jpg";
import cBackpack from "@/assets/cat-backpack.jpg";
import cWallet from "@/assets/cat-wallet.jpg";
import sSignature from "@/assets/showcase-signature.jpg";
import sWomen from "@/assets/showcase-women.jpg";
import sTravel from "@/assets/showcase-travel.jpg";

export type Product = {
  id: string;
  slug: string;
  sku?: string;
  name: string;
  category: string;
  gender: "women" | "men" | "unisex" | "kids";
  ageGroup: "adult" | "teen" | "kids";
  price: number;
  was?: number;
  brand: string;
  color: string;
  material: string;
  size: string;
  capacity?: string;
  dimensions?: string;
  weight?: string;
  compartments?: number | string;
  closureType?: string;
  strapType?: string;
  laptopCompatible?: boolean;
  waterResistant?: boolean;
  careInstructions?: string;
  status?: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isNew?: boolean;
  isBestseller?: boolean;
  badge?: string;
  description: string;
  images: string[];
};

export const CATEGORIES = [
  { slug: "handbags", name: "Women's Handbags", img: cWomen },
  { slug: "office", name: "Office & Laptop", img: cOffice },
  { slug: "school", name: "School & Kids", img: cSchool },
  { slug: "travel", name: "Travel & Trolley", img: cTravel },
  { slug: "backpacks", name: "Backpacks", img: cBackpack },
  { slug: "wallets", name: "Wallets & Pouches", img: cWallet },
  { slug: "sling", name: "Sling & Shoulder", img: sWomen },
  { slug: "duffel", name: "Duffel & Gym", img: sTravel },
  { slug: "signature", name: "Signature Series", img: sSignature },
];

const IMAGES = [p1, p2, p3, p4, cWomen, cOffice, cBackpack, cTravel, sSignature, sWomen, sTravel];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Seed = Omit<Product, "id" | "slug" | "images"> & { img: string; alt?: string };

const seedRaw: Seed[] = [
  { name: "Noir Saffiano Tote", category: "handbags", gender: "women", ageGroup: "adult", price: 4490, was: 5990, brand: "TBH Maison", color: "Black", material: "Saffiano Leather", size: "Medium", rating: 4.9, reviewCount: 312, stock: 24, isBestseller: true, badge: "Bestseller", description: "A sculpted tote in saffiano leather with gold-tone hardware. Spacious enough for the day, refined enough for the evening.", img: p1, alt: sWomen },
  { name: "Cognac Executive Messenger", category: "office", gender: "men", ageGroup: "adult", price: 5890, brand: "TBH Atelier", color: "Cognac", material: "Full-grain Leather", size: "15\"", rating: 4.8, reviewCount: 198, stock: 14, isNew: true, badge: "New", description: "An executive messenger crafted in full-grain cognac leather. Padded laptop sleeve and an interior built for the modern professional.", img: p2, alt: cOffice },
  { name: "Aurum Cabin Trolley 20\"", category: "travel", gender: "unisex", ageGroup: "adult", price: 8990, was: 11990, brand: "TBH Voyager", color: "Champagne", material: "Polycarbonate", size: "20\" Cabin", rating: 4.9, reviewCount: 421, stock: 9, isBestseller: true, badge: "Trending", description: "Aircraft-grade polycarbonate shell, silent twin-spinner wheels, TSA lock. Engineered for the long road.", img: p3, alt: cTravel },
  { name: "Heritage Atlas Backpack", category: "backpacks", gender: "unisex", ageGroup: "adult", price: 3690, brand: "TBH Heritage", color: "Olive", material: "Waxed Canvas", size: "Large", rating: 4.7, reviewCount: 156, stock: 32, isNew: true, badge: "New", description: "A waxed-canvas backpack with leather trims, magnetic snap closures and a dedicated 16\" laptop sleeve.", img: p4, alt: cBackpack },
  { name: "Aurora Crossbody Sling", category: "sling", gender: "women", ageGroup: "adult", price: 2490, brand: "TBH Maison", color: "Blush", material: "Vegan Leather", size: "Small", rating: 4.6, reviewCount: 89, stock: 41, description: "An everyday crossbody in dusty blush with adjustable strap and dual interior compartments.", img: sWomen, alt: p1 },
  { name: "Onyx Wallet Bifold", category: "wallets", gender: "men", ageGroup: "adult", price: 1290, was: 1690, brand: "TBH Atelier", color: "Black", material: "Pebbled Leather", size: "Standard", rating: 4.8, reviewCount: 244, stock: 60, description: "Slim bifold in pebbled leather. RFID-blocking, six card slots, two cash pockets.", img: cWallet, alt: p2 },
  { name: "Junior Pro Schoolbag", category: "school", gender: "kids", ageGroup: "kids", price: 1890, brand: "TBH Kids", color: "Navy", material: "Recycled Polyester", size: "Standard", rating: 4.7, reviewCount: 510, stock: 80, isBestseller: true, badge: "Bestseller", description: "Ergonomic padded straps, reflective trims and a roomy main compartment with laptop sleeve.", img: cSchool, alt: cBackpack },
  { name: "Voyager Duffel 45L", category: "duffel", gender: "unisex", ageGroup: "adult", price: 3290, brand: "TBH Voyager", color: "Charcoal", material: "Ballistic Nylon", size: "Large", rating: 4.7, reviewCount: 132, stock: 22, description: "Weekend-ready duffel with shoe compartment, wet pocket and trolley sleeve.", img: sTravel, alt: cTravel },
  { name: "Signature Gold Clutch", category: "signature", gender: "women", ageGroup: "adult", price: 6990, brand: "TBH Signature", color: "Gold", material: "Metallic Leather", size: "Clutch", rating: 5.0, reviewCount: 64, stock: 6, isNew: true, badge: "Limited", description: "Hand-finished evening clutch with the TBH signature crest in 24k-plated brass.", img: sSignature, alt: p1 },
  { name: "City Pro 16\" Laptop Bag", category: "office", gender: "unisex", ageGroup: "adult", price: 4290, brand: "TBH Atelier", color: "Slate", material: "Recycled Nylon", size: "16\"", rating: 4.6, reviewCount: 175, stock: 28, description: "Slim profile, foam-padded laptop compartment, organiser panel and water-resistant build.", img: cOffice, alt: p2 },
  { name: "Pebble Hobo Shoulder", category: "handbags", gender: "women", ageGroup: "adult", price: 3990, brand: "TBH Maison", color: "Camel", material: "Pebbled Leather", size: "Medium", rating: 4.6, reviewCount: 102, stock: 19, description: "Slouchy hobo silhouette with a single rolled handle and suede-lined interior.", img: cWomen, alt: sWomen },
  { name: "Trailblazer Hiking Pack 35L", category: "backpacks", gender: "unisex", ageGroup: "adult", price: 4490, brand: "TBH Outdoor", color: "Forest", material: "Ripstop Nylon", size: "Large", rating: 4.8, reviewCount: 87, stock: 18, isNew: true, description: "Ventilated back panel, hydration sleeve, rain cover and load-lifter straps.", img: cBackpack, alt: p4 },
  { name: "Skyline Check-in Trolley 28\"", category: "travel", gender: "unisex", ageGroup: "adult", price: 11990, was: 14990, brand: "TBH Voyager", color: "Midnight", material: "Polycarbonate", size: "28\" Check-in", rating: 4.8, reviewCount: 213, stock: 7, badge: "Sale", description: "Expandable check-in shell with double-spinner wheels and a built-in TSA lock.", img: cTravel, alt: p3 },
  { name: "Pouchette Mini Clutch", category: "wallets", gender: "women", ageGroup: "adult", price: 1490, brand: "TBH Maison", color: "Ivory", material: "Quilted Leather", size: "Mini", rating: 4.5, reviewCount: 56, stock: 35, description: "A mini quilted pouchette with a detachable wrist strap.", img: cWallet, alt: sWomen },
  { name: "Junior Trolley Schoolbag 18\"", category: "school", gender: "kids", ageGroup: "kids", price: 2790, brand: "TBH Kids", color: "Royal", material: "1680D Polyester", size: "18\"", rating: 4.7, reviewCount: 198, stock: 26, description: "Detachable trolley wheels, ergonomic shoulder straps and three storage compartments.", img: cSchool, alt: cBackpack },
  { name: "Loft Sling Pro", category: "sling", gender: "men", ageGroup: "adult", price: 1990, brand: "TBH Urban", color: "Black", material: "Cordura", size: "Small", rating: 4.6, reviewCount: 144, stock: 52, isBestseller: true, description: "Anti-theft sling with hidden zipper, magnetic buckle and tablet sleeve.", img: sWomen, alt: p2 },
  { name: "Weekender Leather Duffel", category: "duffel", gender: "unisex", ageGroup: "adult", price: 7490, brand: "TBH Heritage", color: "Tan", material: "Full-grain Leather", size: "Large", rating: 4.9, reviewCount: 71, stock: 8, badge: "Editor's Pick", description: "Hand-stitched tan leather weekender that ages beautifully with every journey.", img: sTravel, alt: cTravel },
  { name: "Signature Monogram Tote", category: "signature", gender: "women", ageGroup: "adult", price: 9490, brand: "TBH Signature", color: "Bronze", material: "Embossed Leather", size: "Large", rating: 4.9, reviewCount: 48, stock: 5, badge: "Signature", description: "Embossed TBH monogram on supple bronze leather. A statement that travels with you.", img: sSignature, alt: p1 },
  { name: "Daily Carry Backpack 22L", category: "backpacks", gender: "unisex", ageGroup: "adult", price: 2890, brand: "TBH Urban", color: "Graphite", material: "Recycled Polyester", size: "Medium", rating: 4.5, reviewCount: 233, stock: 64, description: "Minimal silhouette, magnetic top flap and a fleece-lined laptop pocket.", img: p4, alt: cBackpack },
  { name: "Pearl Evening Handbag", category: "handbags", gender: "women", ageGroup: "adult", price: 5490, brand: "TBH Maison", color: "Pearl", material: "Satin", size: "Small", rating: 4.7, reviewCount: 39, stock: 11, isNew: true, description: "Satin evening bag with crystal-encrusted clasp and detachable chain strap.", img: p1, alt: sWomen },
];

const SEED: Product[] = seedRaw.map((s, i) => ({
  ...s,
  id: `p-${String(i + 1).padStart(3, "0")}`,
  slug: slugify(s.name),
  images: [s.img, s.alt ?? s.img, IMAGES[(i + 3) % IMAGES.length], IMAGES[(i + 6) % IMAGES.length]],
}));

const STORAGE_KEY = "tbh_products_v1";

export const seedProducts = (): Product[] => SEED;

export const loadProducts = (): Product[] => {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) && parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
};

export const saveProducts = (products: Product[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent("tbh:products"));
};

export const resetProducts = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("tbh:products"));
};

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/**
 * Adapt backend Express/Prisma product entity to the Bombay Bag House storefront Product model
 */
export const adaptBackendProduct = (p: any): Product => {
  const specs = p.specifications || {};
  const inv = p.inventory || {};
  const sellingPrice = Number(p.sellingPrice ?? p.discountPrice ?? p.price ?? 0);
  const rawBasePrice = p.basePrice ?? (p.discountPrice && p.price > p.discountPrice ? p.price : undefined);
  const basePrice = rawBasePrice ? Number(rawBasePrice) : 0;
  const wasPrice = basePrice > sellingPrice ? basePrice : undefined;

  // Derive category slug cleanly
  let categorySlug = p.category?.slug || "handbags";
  if (categorySlug.includes("tote")) categorySlug = "handbags";
  else if (categorySlug.includes("laptop")) categorySlug = "office";
  else if (categorySlug.includes("school")) categorySlug = "school";
  else if (categorySlug.includes("travel")) categorySlug = "travel";
  else if (categorySlug.includes("backpack")) categorySlug = "backpacks";
  else if (categorySlug.includes("wallet")) categorySlug = "wallets";
  else if (categorySlug.includes("sling")) categorySlug = "sling";
  else if (categorySlug.includes("duffel")) categorySlug = "duffel";
  else if (categorySlug.includes("clutch")) categorySlug = "signature";

  const images = Array.isArray(p.images) && p.images.length > 0 
    ? p.images 
    : [p.thumbnail || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"];

  const resolvedStock =
    typeof p.stock === "number"
      ? p.stock
      : typeof inv.quantity === "number"
        ? inv.quantity
        : 0;

  return {
    id: p.id,
    slug: p.slug || p.id,
    sku: p.sku || p.id,
    name: p.name,
    category: categorySlug,
    gender: (p.gender?.toLowerCase() as any) || "unisex",
    ageGroup: (specs.ageGroup?.toLowerCase() as any) || "adult",
    price: sellingPrice,
    was: wasPrice,
    brand: p.brand || specs.brand || "Bombay Bag House",
    color: specs.color || "Classic",
    material: specs.material || "Premium Leather",
    size: specs.dimensions || specs.capacity || "Standard",
    capacity: specs.capacity || undefined,
    dimensions: specs.dimensions || undefined,
    weight: specs.weight || undefined,
    compartments: specs.compartments ?? undefined,
    closureType: specs.closureType || undefined,
    strapType: specs.strapType || undefined,
    laptopCompatible: typeof specs.laptopCompatible === "boolean" ? specs.laptopCompatible : undefined,
    waterResistant: typeof specs.waterResistant === "boolean" ? specs.waterResistant : undefined,
    careInstructions: p.careInstructions || specs.careInstructions || undefined,
    status: p.status || (p.isActive === false ? "INACTIVE" : "ACTIVE"),
    rating: typeof p.rating === "number" ? p.rating : 4.8,
    reviewCount: Array.isArray(p.reviews) ? p.reviews.length : (p.reviewCount ?? 0),
    stock: resolvedStock,
    isNew: p.isTrending || p.isFeatured,
    isBestseller: p.isFeatured,
    badge: p.badge || (p.isFeatured ? "Bestseller" : p.isTrending ? "Trending" : undefined),
    description: p.description || "Crafted with precision for everyday luxury and enduring elegance.",
    images: images.length >= 2 ? images : [...images, images[0]],
  };
};

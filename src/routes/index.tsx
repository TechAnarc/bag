import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ShoppingBag, Heart, Search, Menu, ArrowRight, Star, Plus,
  Truck, ShieldCheck, Sparkles, Award, Headphones, Instagram,
  MessageCircle, MapPin, ChevronRight, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/catalog";
import api from "@/lib/axios";

import logo from "@/assets/logo-tbh.png";
import hero from "@/assets/hero-bags.jpg";
import catWomen from "@/assets/cat-women.jpg";
import catOffice from "@/assets/cat-office.jpg";
import catSchool from "@/assets/cat-school.jpg";
import catTravel from "@/assets/cat-travel.jpg";
import catBackpack from "@/assets/cat-backpack.jpg";
import catWallet from "@/assets/cat-wallet.jpg";
import showcaseSignature from "@/assets/showcase-signature.jpg";
import showcaseWomen from "@/assets/showcase-women.jpg";
import showcaseTravel from "@/assets/showcase-travel.jpg";
import storyCraft from "@/assets/story-craft.jpg";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Triveni Bombay Bag House — Carry Style. Carry Confidence." },
      { name: "description", content: "Premium bags for every lifestyle — handbags, school bags, backpacks, office bags, travel luggage, wallets and signature collections." },
      { property: "og:title", content: "Triveni Bombay Bag House" },
      { property: "og:description", content: "Every Journey Deserves the Perfect Bag." },
    ],
  }),
  component: Index,
});

const NAV: { label: string; category?: string }[] = [
  { label: "Women", category: "handbags" },
  { label: "Men", category: "office" },
  { label: "Travel", category: "travel" },
  { label: "School", category: "school" },
  { label: "Office", category: "office" },
  { label: "Signature", category: "signature" },
];

const CATEGORIES = [
  { name: "Women's Handbags", slug: "handbags", count: "120+ styles", img: catWomen },
  { name: "Office & Laptop", slug: "office", count: "Executive line", img: catOffice },
  { name: "School & Kids", slug: "school", count: "Back-to-school", img: catSchool },
  { name: "Travel & Trolley", slug: "travel", count: "Cabin to check-in", img: catTravel },
  { name: "Backpacks", slug: "backpacks", count: "Daily companions", img: catBackpack },
  { name: "Wallets & Pouches", slug: "wallets", count: "Accessories", img: catWallet },
];

const COLLECTIONS = [
  { title: "Executive", category: "office", line: "For the boardroom and beyond", img: catOffice, cta: "Discover the suite" },
  { title: "Women's Luxury", category: "handbags", line: "Timeless silhouettes, modern soul", img: showcaseWomen, cta: "Shop the women's edit" },
  { title: "Travel", category: "travel", line: "Engineered for the long road", img: showcaseTravel, cta: "Explore luggage" },
  { title: "Signature Series", category: "signature", line: "The TBH signature, in gold", img: showcaseSignature, cta: "Enter the signature" },
];

const FEATURES = [
  { icon: Sparkles, t: "Premium Quality", d: "Hand-finished, built to outlast trends." },
  { icon: Award, t: "Latest Designs", d: "New arrivals every season." },
  { icon: ShieldCheck, t: "Secure Payments", d: "All major methods, fully encrypted." },
  { icon: Truck, t: "Fast Shipping", d: "Dispatched within 24 hours." },
  { icon: Heart, t: "Trusted Store", d: "Loved by 50,000+ customers." },
  { icon: Headphones, t: "Always Here", d: "Concierge support, 7 days a week." },
];

const TESTIMONIALS = [
  { name: "Ananya Mehta", role: "Mumbai", quote: "My Noir Tote has travelled three continents with me. Still looks like the day I bought it.", img: "https://i.pravatar.cc/120?img=47" },
  { name: "Rohan Sethi", role: "Bengaluru", quote: "Best office bag I have ever owned. Quality is on par with brands costing thrice as much.", img: "https://i.pravatar.cc/120?img=12" },
  { name: "Priya Sharma", role: "Delhi", quote: "Bought school bags for both my kids — premium, sturdy and they love the look.", img: "https://i.pravatar.cc/120?img=32" },
];

const IG_GRID = [catWomen, showcaseSignature, p1, catTravel, p3, showcaseWomen, p2, catWallet];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Announcement />
      <Header />
      <Hero />
      <Marquee />
      <Categories />
      <Bestsellers />
      <Collections />
      <BrandStory />
      <Features />
      <Testimonials />
      <Instagram_ />
      <Newsletter />
      <Footer />
    </div>
  );
}

/* ----------------------------- COMPONENTS ----------------------------- */

function Announcement() {
  return (
    <div className="bg-[var(--ink)] text-[var(--cream)] text-xs tracking-[0.2em] uppercase">
      <div className="mx-auto max-w-7xl px-6 py-2.5 flex items-center justify-center gap-3">
        <span className="hidden sm:inline opacity-70">Complimentary shipping over ₹1,999</span>
        <span className="hidden sm:inline opacity-40">·</span>
        <span className="text-gradient-gold font-medium">New Season Signature Collection · Now Live</span>
        <span className="hidden sm:inline opacity-40">·</span>
        <span className="hidden sm:inline opacity-70">Easy 7-day returns</span>
      </div>
    </div>
  );
}

function Header() {
  const { cartCount, wishlist } = useStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border" : "bg-transparent"}`}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-[auto_1fr_auto] items-center gap-6 h-20">
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img src={logo} alt="TBH" width={44} height={44} className="h-11 w-11 object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)] group-hover:rotate-3 transition-transform duration-500" />
          <div className="hidden sm:block leading-tight">
            <div className="font-serif text-base tracking-wide">Triveni Bombay</div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Bag House</div>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center justify-center gap-10 text-sm font-medium">
          {NAV.map(n => (
            <Link key={n.label} to="/shop" search={{ category: n.category }} className="relative py-2 group">
              {n.label}
              <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-gradient-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2 justify-self-end">
          <IconBtn label="Search" onClick={() => navigate({ to: "/shop" })}><Search className="h-[18px] w-[18px]" /></IconBtn>
          <IconBtn label="Wishlist" badge={wishlist.length > 0 ? wishlist.length : undefined} onClick={() => navigate({ to: "/wishlist" })}><Heart className="h-[18px] w-[18px]" /></IconBtn>
          <IconBtn label="Bag" badge={cartCount > 0 ? cartCount : undefined} onClick={() => navigate({ to: "/cart" })}><ShoppingBag className="h-[18px] w-[18px]" /></IconBtn>
          <button onClick={() => setOpen(v => !v)} className="lg:hidden ml-1 grid place-items-center h-10 w-10 rounded-full hover:bg-muted" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-up">
          <nav className="px-6 py-4 flex flex-col gap-1">
            {NAV.map(n => (
              <Link key={n.label} to="/shop" search={{ category: n.category }} onClick={() => setOpen(false)} className="py-3 border-b border-border/60 text-sm">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function IconBtn({ children, label, badge, onClick }: { children: React.ReactNode; label: string; badge?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} className="relative grid place-items-center h-10 w-10 rounded-full hover:bg-muted transition-colors">
      {children}
      {badge !== undefined && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-gradient-gold text-[10px] font-semibold text-[var(--ink)]">{badge}</span>
      )}
    </button>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY * 0.3);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <section ref={ref} className="relative overflow-hidden bg-[var(--ink)] text-[var(--cream)]">
      <div className="absolute inset-0">
        <img src={hero} alt="Premium bag collection" width={1920} height={1280}
          className="h-full w-full object-cover opacity-70"
          style={{ transform: `translate3d(0, ${y}px, 0) scale(1.05)` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)] via-[var(--ink)]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-32 md:pt-40 md:pb-48 min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-2xl animate-fade-up">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-12 bg-gradient-gold" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-light)]">Est. Bombay · Signature Edit ’26</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[0.95] font-light">
            Every journey<br />
            deserves the<br />
            <span className="italic shimmer-gold">perfect bag.</span>
          </h1>
          <p className="mt-8 text-base md:text-lg max-w-lg text-[var(--cream)]/80 leading-relaxed">
            From school days to global adventures — discover premium bags, crafted for every lifestyle, every story, every you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/shop" className="group inline-flex items-center gap-2 bg-gradient-gold text-[var(--ink)] px-7 py-3.5 text-sm font-semibold tracking-wide shadow-gold hover:shadow-luxe transition-all duration-300 hover:-translate-y-0.5">
              Shop Collection <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#featured-categories" className="inline-flex items-center gap-2 border border-[var(--cream)]/30 text-[var(--cream)] px-7 py-3.5 text-sm font-medium tracking-wide hover:bg-[var(--cream)] hover:text-[var(--ink)] transition-all duration-300">
              Explore Categories
            </a>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
            {[
              ["50k+", "Happy customers"],
              ["15", "Categories"],
              ["4.9★", "Avg rating"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-serif text-3xl text-[var(--gold-light)]">{n}</div>
                <div className="text-xs uppercase tracking-widest text-[var(--cream)]/60 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block absolute right-10 bottom-10 text-[10px] tracking-[0.4em] uppercase text-[var(--cream)]/50 rotate-90 origin-bottom-right">
          Scroll to discover ↓
        </div>
      </div>

      {/* Floating gold orb */}
      <div className="hidden lg:block absolute right-[8%] top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-gradient-gold blur-[80px] opacity-30 animate-float pointer-events-none" />
    </section>
  );
}

function Marquee() {
  const items = ["Premium Quality", "Hand Finished", "Free Shipping", "7-Day Returns", "Secure Checkout", "New Arrivals Weekly"];
  return (
    <div className="bg-[var(--ink)] text-[var(--cream)] border-y border-[var(--gold)]/20 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-5">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="mx-10 text-xs tracking-[0.4em] uppercase flex items-center gap-10">
            <span className="text-[var(--gold-light)]">✦</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14">
      <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-dark)] mb-4">{kicker}</div>
      <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
      <div className="hairline w-24 mx-auto mt-6" />
    </div>
  );
}

function Categories() {
  return (
    <section id="featured-categories" className="py-24 md:py-32 bg-[var(--cream)]">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel kicker="Shop by World" title="Featured Categories" sub="From classroom to boardroom to runway — a bag for every chapter." />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {CATEGORIES.map((c, i) => (
            <Link key={c.name} to="/shop" search={{ category: c.slug }} className="group relative aspect-[4/5] overflow-hidden bg-background">
              <img src={c.img} alt={c.name} loading="lazy" width={900} height={1100}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/90 via-[var(--ink)]/10 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-[var(--gold)]/0 group-hover:ring-[var(--gold)]/60 transition-all duration-500" />
              <div className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-[var(--cream)]/70">0{i + 1}</div>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-[var(--cream)]">
                <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--gold-light)]">{c.count}</div>
                <div className="mt-1 font-serif text-2xl md:text-3xl">{c.name}</div>
                <div className="mt-4 inline-flex items-center gap-2 text-xs tracking-wide opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  Shop now <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Bestsellers() {
  const { products } = useStore();
  const featured = [
    ...products.filter((p) => p.isBestseller || p.isNew),
    ...products.filter((p) => !p.isBestseller && !p.isNew),
  ].slice(0, 4);

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-8 mb-14">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-dark)] mb-3">The Edit</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light max-w-xl">Best Sellers, hand-picked.</h2>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-2 text-sm font-medium border-b border-[var(--ink)] pb-1 hover:border-[var(--gold)] hover:text-[var(--gold-dark)] transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ p }: { p: Product }) {
  const { addToCart, toggleWishlist, isWished } = useStore();
  const wish = isWished(p.id);
  return (
    <div className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--cream)]">
        <Link to="/product/$slug" params={{ slug: p.slug }} aria-label={p.name} className="absolute inset-0 z-0 block">
          <img src={p.images[0]} alt={p.name} loading="lazy" width={900} height={1100}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
        </Link>
        {p.badge && (
          <span className="pointer-events-none absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase bg-[var(--ink)] text-[var(--cream)]">{p.badge}</span>
        )}
        <button onClick={() => toggleWishlist(p.id)} aria-label="Wishlist"
          className="absolute top-3 right-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-background/80 backdrop-blur hover:bg-background transition">
          <Heart className={`h-4 w-4 transition ${wish ? "fill-[var(--gold-dark)] text-[var(--gold-dark)]" : ""}`} />
        </button>
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <button
            onClick={() => { addToCart(p.id); toast.success("Added to bag", { description: p.name }); }}
            disabled={p.stock <= 0}
            className="flex-1 bg-[var(--ink)] text-[var(--cream)] py-3 text-xs tracking-[0.2em] uppercase hover:bg-gradient-gold hover:text-[var(--ink)] transition-colors disabled:opacity-50"
          >
            {p.stock <= 0 ? "Out of stock" : "Add to bag"}
          </button>
          <Link to="/product/$slug" params={{ slug: p.slug }} aria-label="Quick view" className="grid place-items-center h-11 w-11 bg-background hover:bg-gradient-gold transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="pt-4">
        <div className="flex items-center gap-1 text-[var(--gold-dark)] mb-1.5">
          <Star className="h-3 w-3 fill-current" />
          <span className="text-[11px] tracking-wide">{p.rating}</span>
        </div>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="font-serif text-lg leading-snug hover:text-[var(--gold-dark)] transition-colors block">{p.name}</Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-medium">₹{p.price.toLocaleString("en-IN")}</span>
          {p.was && <span className="text-xs text-muted-foreground line-through">₹{p.was.toLocaleString("en-IN")}</span>}
        </div>
      </div>
    </div>
  );
}

function Collections() {
  return (
    <section className="py-24 md:py-32 bg-[var(--ink)] text-[var(--cream)]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-light)] mb-4">Maison Collections</div>
          <h2 className="font-serif text-4xl md:text-6xl font-light">Premium Collections.</h2>
          <p className="mt-4 text-[var(--cream)]/70 max-w-xl mx-auto">Four worlds, one obsession with detail.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          {COLLECTIONS.map((c, i) => (
            <Link key={c.title} to="/shop" search={{ category: c.category }} className={`group relative overflow-hidden ${i % 3 === 0 ? "md:row-span-1" : ""} ${i === 1 ? "md:mt-16" : ""} ${i === 3 ? "md:-mt-16" : ""}`}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={c.img} alt={c.title} loading="lazy" width={1200} height={1500}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/30 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
                <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-light)] mb-3">Collection · 0{i + 1}</div>
                <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light italic">{c.title}</h3>
                <p className="mt-3 text-[var(--cream)]/80 max-w-md">{c.line}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm border-b border-[var(--gold)] pb-1 group-hover:gap-4 transition-all">
                  {c.cta} <ArrowRight className="h-4 w-4 text-[var(--gold-light)]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandStory() {
  return (
    <section className="py-24 md:py-32 bg-[var(--cream)]">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative">
          <img src={storyCraft} alt="Craftsmanship" loading="lazy" width={1400} height={1000}
            className="w-full aspect-[5/6] object-cover" />
          <div className="absolute -bottom-6 -right-6 hidden md:block bg-[var(--ink)] text-[var(--cream)] p-8 max-w-[260px] shadow-luxe">
            <div className="font-serif text-5xl text-[var(--gold-light)]">25+</div>
            <div className="text-xs tracking-[0.3em] uppercase mt-1">Years of trust in Bombay</div>
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-dark)] mb-4">Our Story</div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05]">
            A house built on <em className="text-gradient-gold not-italic font-normal">leather, trust</em> and the streets of Bombay.
          </h2>
          <p className="mt-8 text-muted-foreground leading-relaxed">
            Triveni Bombay Bag House began as a small storefront with one promise — a bag for every Indian, made to last every chapter of life. Today we curate over fifteen categories under one roof, blending heritage craftsmanship with the polish of a modern maison.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every stitch, every gold-toned rivet, every interior lining is chosen by hand. Because we still believe a great bag is more than an accessory — it's a quiet companion on the road, in the office, at the airport, and everywhere your story takes you.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            {[
              ["15+", "Categories"],
              ["50k", "Customers"],
              ["4.9★", "Rated"],
            ].map(([n, l]) => (
              <div key={l} className="border-l border-[var(--gold)]/40 pl-4">
                <div className="font-serif text-3xl">{n}</div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel kicker="Why TBH" title="A house of details." sub="Six small obsessions that add up to a very big difference." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="group bg-background p-10 hover:bg-[var(--cream)] transition-colors duration-500">
              <div className="grid place-items-center h-14 w-14 rounded-full border border-[var(--gold)]/40 text-[var(--gold-dark)] group-hover:bg-gradient-gold group-hover:text-[var(--ink)] group-hover:border-transparent transition-all duration-500">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-2xl mt-6">{t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(v => (v + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, []);
  const t = TESTIMONIALS[i];
  return (
    <section className="py-24 md:py-32 bg-[var(--ink)] text-[var(--cream)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/10 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-light)] mb-6">In Their Words</div>
        <div className="flex justify-center gap-1 mb-8 text-[var(--gold-light)]">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
        </div>
        <blockquote key={t.name} className="font-serif text-2xl md:text-4xl lg:text-5xl font-light leading-[1.25] italic animate-fade-up">
          “{t.quote}”
        </blockquote>
        <div className="mt-10 flex items-center justify-center gap-4">
          <img src={t.img} alt={t.name} loading="lazy" width={56} height={56} className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--gold)]/50" />
          <div className="text-left">
            <div className="font-medium">{t.name}</div>
            <div className="text-xs tracking-widest uppercase text-[var(--cream)]/60">{t.role}</div>
          </div>
        </div>
        <div className="mt-10 flex justify-center gap-2">
          {TESTIMONIALS.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Story ${idx + 1}`}
              className={`h-1.5 transition-all duration-500 ${idx === i ? "w-10 bg-gradient-gold" : "w-4 bg-[var(--cream)]/30"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Instagram_() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-dark)] mb-4">@triveni_bombay_bag_house</div>
          <h2 className="font-serif text-4xl md:text-5xl font-light">Carried by you, worn by Bombay.</h2>
          <a href="https://www.instagram.com/triveni_bombay_bag_house/" target="_blank" rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm border-b border-[var(--ink)] pb-1 hover:text-[var(--gold-dark)] hover:border-[var(--gold)] transition">
            <Instagram className="h-4 w-4" /> Follow on Instagram
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {IG_GRID.map((src, i) => (
            <a key={i} href="https://www.instagram.com/triveni_bombay_bag_house/" target="_blank" rel="noreferrer"
              className="group relative aspect-square overflow-hidden">
              <img src={src} alt="" loading="lazy" width={600} height={600}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-[var(--ink)]/0 group-hover:bg-[var(--ink)]/60 transition-colors grid place-items-center">
                <Instagram className="h-6 w-6 text-[var(--cream)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await api.post("/contact", {
        name: "Newsletter Subscriber",
        email: email.trim(),
        subject: "Newsletter Subscription",
        message: `Newsletter signup from ${email.trim()}`,
      });
    } catch {
      // Allow offline feedback without losing UX
    }
    toast.success("Welcome to the House — you're on the list.");
    setEmail("");
  };
  return (
    <section className="bg-[var(--cream)] py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Plus className="h-5 w-5 mx-auto text-[var(--gold-dark)]" />
        <h2 className="font-serif text-3xl md:text-5xl font-light mt-6">Join the House.</h2>
        <p className="mt-4 text-muted-foreground">Be first to see new arrivals, signature drops and quiet members-only sales.</p>
        <form className="mt-10 flex flex-col sm:flex-row gap-2 max-w-md mx-auto" onSubmit={onSubscribe}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
            className="flex-1 bg-background border border-border px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--gold)] transition-colors" />
          <button className="bg-[var(--ink)] text-[var(--cream)] px-6 py-3.5 text-xs tracking-[0.2em] uppercase hover:bg-gradient-gold hover:text-[var(--ink)] transition-colors">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  const cols: { title: string; links: { label: string; to: string; search?: Record<string, string> }[] }[] = [
    {
      title: "Shop",
      links: [
        { label: "Women", to: "/shop", search: { category: "handbags" } },
        { label: "Men", to: "/shop", search: { category: "office" } },
        { label: "Travel", to: "/shop", search: { category: "travel" } },
        { label: "School & Kids", to: "/shop", search: { category: "school" } },
        { label: "Office", to: "/shop", search: { category: "office" } },
        { label: "Signature Series", to: "/shop", search: { category: "signature" } },
      ],
    },
    {
      title: "House",
      links: [
        { label: "About Us", to: "/about" },
        { label: "Our Story", to: "/about" },
        { label: "Track Order", to: "/track" },
        { label: "Contact", to: "/contact" },
      ],
    },
    {
      title: "Service",
      links: [
        { label: "Shipping", to: "/policy/shipping" },
        { label: "Returns", to: "/policy/returns" },
        { label: "Privacy Policy", to: "/policy/privacy" },
        { label: "Terms & Conditions", to: "/policy/terms" },
      ],
    },
  ];
  return (
    <footer className="bg-[var(--ink)] text-[var(--cream)] pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1.3fr_2fr_1fr] gap-12 pb-16 border-b border-[var(--cream)]/10">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="TBH" width={48} height={48} className="h-12 w-12 object-contain" />
              <div>
                <div className="font-serif text-lg">Triveni Bombay</div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--gold-light)]">Bag House</div>
              </div>
            </div>
            <p className="mt-6 text-sm text-[var(--cream)]/70 max-w-sm leading-relaxed">
              Carry style. Carry confidence. Premium bags for every age, occasion and lifestyle — under one roof, since day one.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/triveni_bombay_bag_house/" },
                { Icon: MessageCircle, href: "https://wa.me/" },
                { Icon: MapPin, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noreferrer"
                  className="grid place-items-center h-10 w-10 rounded-full border border-[var(--cream)]/20 hover:bg-gradient-gold hover:text-[var(--ink)] hover:border-transparent transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {cols.map(col => (
              <div key={col.title}>
                <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-light)] mb-5">{col.title}</div>
                <ul className="space-y-3 text-sm">
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link to={l.to as any} search={l.search as any} className="text-[var(--cream)]/75 hover:text-[var(--cream)] inline-flex items-center gap-1.5 group">
                        {l.label}
                        <ChevronRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--gold-light)] mb-5">Visit</div>
            <p className="text-sm text-[var(--cream)]/70 leading-relaxed">
              Triveni Bombay Bag House<br />
              Mumbai, Maharashtra<br />
              India
            </p>
            <p className="mt-4 text-sm text-[var(--cream)]/70">Open daily · 10am – 9pm</p>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--cream)]/50">
          <div>© {new Date().getFullYear()} Triveni Bombay Bag House. All rights reserved.</div>
          <div className="tracking-[0.3em] uppercase">Carry Style · Carry Confidence</div>
        </div>
      </div>
    </footer>
  );
}

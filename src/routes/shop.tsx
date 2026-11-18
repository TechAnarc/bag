import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, X, ChevronDown, ChevronRight, SlidersHorizontal, Mic, Star,
  LayoutGrid, List, Heart, ShoppingBag, Eye, GitCompareArrows,
  Sparkles, ShieldCheck, Truck, RotateCcw, Gem, Headphones, BadgeCheck,
  TrendingUp, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { CATEGORIES, inr, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";

// ============ Types & constants ============

type SortKey =
  | "featured" | "newest" | "popularity" | "rating"
  | "price-asc" | "price-desc" | "best-selling" | "recommended";

type Search = { category?: string; sort?: SortKey; q?: string };

type PillSpec = {
  id: string;
  label: string;
  match: (p: Product) => boolean;
};

const PILLS: PillSpec[] = [
  { id: "all", label: "All Categories", match: () => true },
  { id: "school", label: "School Bags", match: (p) => p.category === "school" },
  { id: "kids", label: "Kids Bags", match: (p) => p.gender === "kids" || p.ageGroup === "kids" },
  { id: "backpacks", label: "Backpacks", match: (p) => p.category === "backpacks" },
  { id: "laptop", label: "Laptop Bags", match: (p) => /laptop|\d{2}"/i.test(p.size) || p.category === "office" },
  { id: "office", label: "Office Bags", match: (p) => p.category === "office" },
  { id: "handbags", label: "Women's Handbags", match: (p) => p.category === "handbags" },
  { id: "tote", label: "Tote Bags", match: (p) => /tote/i.test(p.name) },
  { id: "sling", label: "Sling Bags", match: (p) => p.category === "sling" || /sling/i.test(p.name) },
  { id: "shoulder", label: "Shoulder Bags", match: (p) => p.category === "sling" || /shoulder|hobo/i.test(p.name) },
  { id: "travel", label: "Travel Bags", match: (p) => p.category === "travel" || p.category === "duffel" },
  { id: "duffel", label: "Duffel Bags", match: (p) => p.category === "duffel" },
  { id: "cabin", label: "Cabin Bags", match: (p) => /cabin|20"/i.test(p.size) || /cabin/i.test(p.name) },
  { id: "trolley", label: "Trolley Bags", match: (p) => /trolley/i.test(p.name) || p.material === "Polycarbonate" },
  { id: "suitcases", label: "Suitcases", match: (p) => p.material === "Polycarbonate" },
  { id: "gym", label: "Gym Bags", match: (p) => p.category === "duffel" },
  { id: "wallets", label: "Wallets", match: (p) => p.category === "wallets" && /wallet/i.test(p.name) },
  { id: "pouches", label: "Pouches", match: (p) => /pouch|clutch/i.test(p.name) },
  { id: "accessories", label: "Accessories", match: (p) => p.category === "wallets" },
  { id: "signature", label: "Signature Collection", match: (p) => p.category === "signature" },
  { id: "new", label: "New Arrivals", match: (p) => !!p.isNew },
  { id: "best", label: "Best Sellers", match: (p) => !!p.isBestseller },
  { id: "trending", label: "Trending", match: (p) => p.reviewCount > 150 },
  { id: "luxury", label: "Luxury Collection", match: (p) => p.category === "signature" || p.price >= 6000 },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Best Rating" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
  { value: "recommended", label: "Recommended" },
];

const PRICE_CHIPS: { label: string; range: [number, number] }[] = [
  { label: "₹0 – ₹500", range: [0, 500] },
  { label: "₹500 – ₹1,000", range: [500, 1000] },
  { label: "₹1,000 – ₹2,000", range: [1000, 2000] },
  { label: "₹2,000 – ₹5,000", range: [2000, 5000] },
  { label: "₹5,000+", range: [5000, 100000] },
];

const COLOR_MAP: Record<string, string> = {
  Black: "#0b0b0c", Cognac: "#9a5a2b", Champagne: "#e6cf9a", Olive: "#5b6a3a",
  Blush: "#e8c5c5", Navy: "#1a2547", Charcoal: "#2f3236", Gold: "#d4af37",
  Slate: "#5d6770", Camel: "#b8895b", Forest: "#2f4a36", Midnight: "#0e1424",
  Ivory: "#f3ebdc", Royal: "#1f3fb0", Tan: "#c79a6b", Bronze: "#7a5230",
  Graphite: "#3b3d40", Pearl: "#efe7d8",
};

const TRENDING_SEARCHES = [
  "Laptop Bags", "Travel Trolley", "Women's Handbags",
  "School Bags", "Wallets", "Signature Tote",
];

const RECENT_SEARCHES_KEY = "tbh_recent_searches";

// ============ Route ============

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    sort: (s.sort as SortKey) ?? "featured",
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Collection — Triveni Bombay Bag House" },
      { name: "description", content: "Premium bags for school, travel, work and everyday life. Discover handbags, backpacks, trolleys, wallets and signature collections." },
    ],
  }),
  component: ShopPage,
});

// ============ Helpers ============

const useDebounced = <T,>(value: T, ms = 200) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

// ============ Page ============

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { products } = useStore();

  // --- Derived option lists ---
  const allColors = useMemo(() => [...new Set(products.map((p) => p.color))], [products]);
  const allMaterials = useMemo(() => [...new Set(products.map((p) => p.material))], [products]);
  const allBrands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);

  // --- Filter state ---
  const [colors, setColors] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [ages, setAges] = useState<string[]>([]);
  const [capacities, setCapacities] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [offers, setOffers] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([0, 15000]);
  const [minRating, setMinRating] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]); // sidebar checkboxes
  const [brandQuery, setBrandQuery] = useState("");
  const [catQuery, setCatQuery] = useState("");

  // --- UI state ---
  const [pill, setPill] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visible, setVisible] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- Search overlay ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState(search.q ?? "");
  const debouncedSearch = useDebounced(searchText, 150);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);
  const pushRecentSearch = (q: string) => {
    const next = [q, ...recentSearches.filter((r) => r !== q)].slice(0, 6);
    setRecentSearches(next);
    try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  // --- Pill: sync with URL category ---
  useEffect(() => {
    if (search.category) {
      const m = PILLS.find((p) => p.id === search.category) ?? PILLS.find((p) => p.label.toLowerCase().includes(search.category!));
      if (m) setPill(m.id);
    }
  }, [search.category]);

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // --- Filtering pipeline ---
  const filtered = useMemo(() => {
    let list = [...products];
    const activePill = PILLS.find((p) => p.id === pill) ?? PILLS[0];
    list = list.filter(activePill.match);

    if (search.q) {
      const q = search.q.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q));
    }
    if (categoryFilter.length) list = list.filter((p) => categoryFilter.includes(p.category));
    if (colors.length) list = list.filter((p) => colors.includes(p.color));
    if (materials.length) list = list.filter((p) => materials.includes(p.material));
    if (brands.length) list = list.filter((p) => brands.includes(p.brand));
    if (genders.length) list = list.filter((p) => genders.includes(p.gender));
    if (ages.length) list = list.filter((p) => ages.includes(p.ageGroup));
    list = list.filter((p) => p.price >= price[0] && p.price <= price[1]);
    if (minRating) list = list.filter((p) => p.rating >= minRating);

    if (capacities.length) {
      list = list.filter((p) => {
        const s = p.size.toLowerCase();
        return capacities.some((c) => s.includes(c.toLowerCase()));
      });
    }
    if (availability.length) {
      list = list.filter((p) => {
        if (availability.includes("In Stock") && p.stock > 0) return true;
        if (availability.includes("Out of Stock") && p.stock === 0) return true;
        if (availability.includes("Pre Order") && p.stock < 5) return true;
        return false;
      });
    }
    if (offers.length) {
      list = list.filter((p) => {
        if (offers.includes("Discounted") && p.was) return true;
        if (offers.includes("Festival Offer") && p.was && p.was - p.price > 1000) return true;
        if (offers.includes("Clearance") && p.was && (p.was - p.price) / p.was > 0.2) return true;
        if (offers.includes("Buy One Get One") && p.isBestseller) return true;
        return false;
      });
    }
    if (collections.length) {
      list = list.filter((p) => {
        if (collections.includes("New Arrival") && p.isNew) return true;
        if (collections.includes("Best Seller") && p.isBestseller) return true;
        if (collections.includes("Premium") && p.price > 4000) return true;
        if (collections.includes("Luxury") && p.price > 6000) return true;
        if (collections.includes("Signature") && p.category === "signature") return true;
        if (collections.includes("Limited Edition") && p.badge?.toLowerCase().includes("limited")) return true;
        return false;
      });
    }
    // 'features' is decorative — not all in seed data; keep filter pass-through unless materials hint
    if (features.includes("Waterproof")) list = list.filter((p) => /water|nylon|polycarbonate|ripstop/i.test(p.material));
    if (features.includes("Laptop Sleeve")) list = list.filter((p) => /laptop|"/i.test(p.size) || p.category === "office");
    if (features.includes("Lightweight")) list = list.filter((p) => p.material !== "Full-grain Leather");
    if (features.includes("TSA Lock")) list = list.filter((p) => /trolley|cabin|check-in/i.test(p.name));
    if (features.includes("Cabin Friendly")) list = list.filter((p) => /cabin|20"/i.test(p.size));
    if (features.includes("Wheel Support")) list = list.filter((p) => /trolley|cabin|check-in/i.test(p.name));

    switch (search.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "popularity":
      case "best-selling":
        list.sort((a, b) => b.reviewCount - a.reviewCount); break;
      case "newest":
        list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case "recommended":
        list.sort((a, b) => (b.rating * Math.log10(b.reviewCount + 10)) - (a.rating * Math.log10(a.reviewCount + 10)));
        break;
    }
    return list;
  }, [products, pill, search, categoryFilter, colors, materials, brands, genders, ages,
      price, minRating, capacities, availability, offers, collections, features]);

  // --- Active filters counter ---
  const activeFilterCount =
    colors.length + materials.length + brands.length + genders.length + ages.length +
    capacities.length + features.length + availability.length + offers.length +
    collections.length + categoryFilter.length +
    (minRating ? 1 : 0) + (price[0] > 0 || price[1] < 15000 ? 1 : 0);

  const clearAll = () => {
    setColors([]); setMaterials([]); setBrands([]); setGenders([]); setAges([]);
    setCapacities([]); setFeatures([]); setAvailability([]); setOffers([]);
    setCollections([]); setCategoryFilter([]); setMinRating(0); setPrice([0, 15000]);
    setPill("all"); setBrandQuery(""); setCatQuery("");
    navigate({ search: { sort: search.sort } });
  };

  // --- Suggestions ---
  const suggestions = useMemo(() => {
    if (!debouncedSearch.trim()) return [] as Product[];
    const q = debouncedSearch.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      .slice(0, 6);
  }, [debouncedSearch, products]);

  // --- Load more ---
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisible((v) => v + 12);
      setLoadingMore(false);
    }, 400);
  };
  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visible < filtered.length && !loadingMore) handleLoadMore();
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  });

  // Reset visible when filters change
  useEffect(() => { setVisible(12); }, [pill, search.category, search.q, search.sort, activeFilterCount]);

  // --- Recently viewed ---
  const { recent } = useStore();
  const recentItems = useMemo(
    () => recent.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[],
    [recent, products],
  );

  // --- Recommended (top-rated cross-category) ---
  const recommended = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [products],
  );

  const sortLabel = SORTS.find((s) => s.value === search.sort)?.label ?? "Featured";

  // ============ JSX ============

  return (
    <SiteLayout>
      {/* ===== Header ===== */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(60% 80% at 20% 20%, oklch(0.7 0.12 80 / 0.25), transparent 60%), radial-gradient(50% 60% at 80% 80%, oklch(0.7 0.12 80 / 0.18), transparent 60%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cream/60">
            <Link to="/" className="hover:text-gold transition">Home</Link>
            <ChevronRight className="size-3" />
            <span className="text-gold">Shop</span>
          </nav>

          <p className="text-xs uppercase tracking-[0.4em] text-gold">The Maison Collection</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight md:text-6xl">Shop Collection</h1>
          <p className="mt-4 max-w-2xl text-base text-cream/70 md:text-lg">
            Discover premium bags crafted for school, travel, work, fashion, and everyday life.
          </p>

          {/* Meta strip */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-widest text-cream/70">
            <span><span className="text-cream font-semibold">{filtered.length}</span> products</span>
            <span className="h-3 w-px bg-cream/20" />
            <span><span className="text-cream font-semibold">{activeFilterCount}</span> filters</span>
            <span className="h-3 w-px bg-cream/20" />
            <span>Sort: <span className="text-cream font-semibold">{sortLabel}</span></span>
          </div>

          {/* Premium search bar */}
          <div className="mt-8 relative max-w-2xl">
            <div
              onClick={() => setSearchOpen(true)}
              className="group flex h-14 cursor-text items-center gap-3 rounded-full border border-cream/15 bg-cream/5 px-5 backdrop-blur-xl transition hover:border-gold/60 hover:bg-cream/10"
            >
              <Search className="size-5 text-cream/70" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search school bags, trolleys, handbags…"
                className="flex-1 bg-transparent text-sm text-cream placeholder:text-cream/40 outline-none"
              />
              {searchText && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSearchText(""); navigate({ search: { ...search, q: undefined } }); }}
                  className="grid size-7 place-items-center rounded-full bg-cream/10 hover:bg-cream/20"
                  aria-label="Clear search"
                ><X className="size-3.5" /></button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); toast.message("Voice search coming soon"); }}
                className="grid size-9 place-items-center rounded-full bg-gradient-gold text-ink hover:brightness-110"
                aria-label="Voice search"
              ><Mic className="size-4" /></button>
            </div>

            {searchOpen && (
              <SearchOverlay
                close={() => setSearchOpen(false)}
                value={searchText}
                onChange={setSearchText}
                onSubmit={(q) => {
                  if (q.trim()) pushRecentSearch(q.trim());
                  navigate({ search: { ...search, q: q.trim() || undefined } });
                  setSearchOpen(false);
                }}
                suggestions={suggestions}
                recent={recentSearches}
                trending={TRENDING_SEARCHES}
              />
            )}
          </div>
        </div>
      </section>

      {/* ===== Category pill nav ===== */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
            {PILLS.map((p) => {
              const active = pill === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setPill(p.id); navigate({ search: { ...search, category: p.id === "all" ? undefined : p.id } }); }}
                  className={[
                    "shrink-0 rounded-full border px-5 py-2.5 text-xs uppercase tracking-widest transition-all duration-300",
                    active
                      ? "border-gold bg-ink text-cream shadow-[0_8px_28px_-12px_oklch(0.7_0.12_80/0.55)] scale-[1.02]"
                      : "border-border bg-background hover:border-gold/60 hover:scale-[1.03] hover:shadow-[0_6px_20px_-12px_oklch(0.7_0.12_80/0.45)]",
                  ].join(" ")}
                >{p.label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Main grid ===== */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-40 max-h-[calc(100vh-10rem)] overflow-y-auto pr-3 no-scrollbar">
              <FilterPanel
                products={products}
                catQuery={catQuery} setCatQuery={setCatQuery}
                categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                price={price} setPrice={setPrice}
                genders={genders} setGenders={(v) => setGenders(v)}
                ages={ages} setAges={(v) => setAges(v)}
                brandQuery={brandQuery} setBrandQuery={setBrandQuery}
                allBrands={allBrands} brands={brands} setBrands={setBrands}
                allMaterials={allMaterials} materials={materials} setMaterials={setMaterials}
                allColors={allColors} colors={colors} setColors={setColors}
                capacities={capacities} setCapacities={setCapacities}
                features={features} setFeatures={setFeatures}
                minRating={minRating} setMinRating={setMinRating}
                availability={availability} setAvailability={setAvailability}
                offers={offers} setOffers={setOffers}
                collections={collections} setCollections={setCollections}
                onReset={clearAll}
                onApply={() => undefined}
                toggleArr={toggleArr}
              />
            </div>
          </aside>

          {/* Right column */}
          <div>
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{filtered.length}</span>
                <span className="text-muted-foreground">products</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="ml-2 text-xs uppercase tracking-widest text-gold hover:underline">
                    Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-gold"
                >
                  <SlidersHorizontal className="size-4" /> Filters
                  {activeFilterCount > 0 && <span className="ml-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] text-ink">{activeFilterCount}</span>}
                </button>

                <div className="hidden sm:flex items-center rounded-full border border-border p-1">
                  <button
                    onClick={() => setView("grid")}
                    className={`grid size-8 place-items-center rounded-full transition ${view === "grid" ? "bg-ink text-cream" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="Grid view"
                  ><LayoutGrid className="size-4" /></button>
                  <button
                    onClick={() => setView("list")}
                    className={`grid size-8 place-items-center rounded-full transition ${view === "list" ? "bg-ink text-cream" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="List view"
                  ><List className="size-4" /></button>
                </div>

                <div className="relative">
                  <select
                    value={search.sort}
                    onChange={(e) => navigate({ search: { ...search, sort: e.target.value as SortKey } })}
                    className="appearance-none rounded-full border border-border bg-background py-2 pl-4 pr-9 text-xs uppercase tracking-widest cursor-pointer hover:border-gold transition"
                  >
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Grid / List / Empty */}
            {filtered.length === 0 ? (
              <EmptyState onClear={clearAll} />
            ) : (
              <>
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 xl:grid-cols-4"
                      : "flex flex-col gap-5"
                  }
                >
                  {filtered.slice(0, visible).map((p, i) => (
                    <div
                      key={p.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
                    >
                      {view === "grid"
                        ? <LuxuryProductCard product={p} />
                        : <ListProductCard product={p} />}
                    </div>
                  ))}
                </div>

                {/* Load more / infinite */}
                <div ref={sentinelRef} className="mt-12 flex flex-col items-center gap-4">
                  {visible < filtered.length && (
                    <>
                      <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                        {loadingMore && Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted/60" />
                        ))}
                      </div>
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="group inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-10 py-3.5 text-xs uppercase tracking-widest text-cream transition hover:bg-transparent hover:text-ink"
                      >
                        {loadingMore ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-gold transition group-hover:rotate-12" />}
                        Load more ({filtered.length - visible} remaining)
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== Recently Viewed ===== */}
      {recentItems.length > 0 && (
        <Carousel
          eyebrow="Continue Browsing"
          title="Recently Viewed"
          items={recentItems}
        />
      )}

      {/* ===== Recommended ===== */}
      <Carousel
        eyebrow="Curated For You"
        title="You May Also Like"
        items={recommended}
      />

      {/* ===== Trending banner ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl bg-ink text-cream">
          <div className="absolute inset-0 opacity-50"
            style={{ background: "radial-gradient(50% 70% at 30% 50%, oklch(0.7 0.12 80 / 0.35), transparent 70%)" }} />
          <div className="relative grid gap-10 p-10 md:grid-cols-2 md:p-16">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gold flex items-center gap-2"><TrendingUp className="size-4" /> Now Trending</p>
              <h3 className="mt-4 font-serif text-3xl md:text-5xl">The Signature Series 2026</h3>
              <p className="mt-4 max-w-md text-cream/70">
                A new chapter of heritage craftsmanship. Hand-finished leathers, 24k-plated hardware,
                and silhouettes engineered for a lifetime of travel.
              </p>
              <button
                onClick={() => { setPill("signature"); navigate({ search: { ...search, category: "signature" } }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-7 py-3 text-xs font-semibold uppercase tracking-widest text-ink hover:brightness-110"
              >
                Explore Signature <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recommended.slice(0, 3).map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl">
                  <img src={p.images[0]} alt={p.name} className="size-full object-cover transition duration-700 hover:scale-110" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Trust strip ===== */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-10 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { i: ShieldCheck, t: "Secure Payments" },
            { i: Truck, t: "Fast Shipping" },
            { i: RotateCcw, t: "Easy Returns" },
            { i: Gem, t: "Premium Quality" },
            { i: BadgeCheck, t: "Genuine Products" },
            { i: Headphones, t: "Customer Support" },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-gold text-ink"><Icon className="size-5" /></span>
              <span className="text-xs font-medium uppercase tracking-widest">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Mobile filter drawer ===== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden animate-fade-in" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-2xl animate-slide-in-right"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold">Refine</p>
                <h3 className="font-serif text-2xl">Filters</h3>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="grid size-9 place-items-center rounded-full border border-border hover:border-gold">
                <X className="size-4" />
              </button>
            </div>
            <FilterPanel
              products={products}
              catQuery={catQuery} setCatQuery={setCatQuery}
              categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
              price={price} setPrice={setPrice}
              genders={genders} setGenders={setGenders}
              ages={ages} setAges={setAges}
              brandQuery={brandQuery} setBrandQuery={setBrandQuery}
              allBrands={allBrands} brands={brands} setBrands={setBrands}
              allMaterials={allMaterials} materials={materials} setMaterials={setMaterials}
              allColors={allColors} colors={colors} setColors={setColors}
              capacities={capacities} setCapacities={setCapacities}
              features={features} setFeatures={setFeatures}
              minRating={minRating} setMinRating={setMinRating}
              availability={availability} setAvailability={setAvailability}
              offers={offers} setOffers={setOffers}
              collections={collections} setCollections={setCollections}
              onReset={() => { clearAll(); }}
              onApply={() => setDrawerOpen(false)}
              toggleArr={toggleArr}
            />
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

// ============ Search overlay ============

function SearchOverlay({
  close, value, onChange, onSubmit, suggestions, recent, trending,
}: {
  close: () => void; value: string; onChange: (v: string) => void;
  onSubmit: (q: string) => void; suggestions: Product[];
  recent: string[]; trending: string[];
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={close} />
      <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl animate-fade-in">
        <div className="max-h-[70vh] overflow-y-auto p-5">
          {suggestions.length > 0 && (
            <div className="mb-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Suggestions</p>
              <div className="space-y-1">
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => { onSubmit(p.name); }}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted"
                  >
                    <img src={p.images[0]} alt="" className="size-12 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand} · {inr(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {recent.length > 0 && (
            <div className="mb-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Recent searches</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => { onChange(r); onSubmit(r); }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-gold">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-5">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Trending</p>
            <div className="flex flex-wrap gap-2">
              {trending.map((t) => (
                <button key={t} onClick={() => { onChange(t); onSubmit(t); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-3 py-1.5 text-xs font-medium text-ink hover:brightness-110">
                  <TrendingUp className="size-3" /> {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Suggested categories</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.slice(0, 6).map((c) => (
                <Link
                  key={c.slug}
                  to="/shop"
                  search={{ category: c.slug }}
                  onClick={close}
                  className="group relative h-20 overflow-hidden rounded-xl"
                >
                  <img src={c.img} alt={c.name} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-xs font-medium text-cream">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============ Filter panel ============

type FPProps = {
  products: Product[];
  catQuery: string; setCatQuery: (v: string) => void;
  categoryFilter: string[]; setCategoryFilter: (v: string[]) => void;
  price: [number, number]; setPrice: (v: [number, number]) => void;
  genders: string[]; setGenders: (v: string[]) => void;
  ages: string[]; setAges: (v: string[]) => void;
  brandQuery: string; setBrandQuery: (v: string) => void;
  allBrands: string[]; brands: string[]; setBrands: (v: string[]) => void;
  allMaterials: string[]; materials: string[]; setMaterials: (v: string[]) => void;
  allColors: string[]; colors: string[]; setColors: (v: string[]) => void;
  capacities: string[]; setCapacities: (v: string[]) => void;
  features: string[]; setFeatures: (v: string[]) => void;
  minRating: number; setMinRating: (n: number) => void;
  availability: string[]; setAvailability: (v: string[]) => void;
  offers: string[]; setOffers: (v: string[]) => void;
  collections: string[]; setCollections: (v: string[]) => void;
  onReset: () => void; onApply: () => void;
  toggleArr: (arr: string[], setArr: (v: string[]) => void, v: string) => void;
};

function FilterPanel(p: FPProps) {
  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    p.products.forEach((pr) => m.set(pr.category, (m.get(pr.category) ?? 0) + 1));
    return m;
  }, [p.products]);

  return (
    <div className="space-y-1 text-sm">
      <Section title="Categories" defaultOpen>
        <div className="mb-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={p.catQuery}
              onChange={(e) => p.setCatQuery(e.target.value)}
              placeholder="Search categories"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="space-y-2">
          {CATEGORIES
            .filter((c) => c.name.toLowerCase().includes(p.catQuery.toLowerCase()))
            .map((c) => (
              <CheckRow
                key={c.slug}
                label={c.name}
                count={catCounts.get(c.slug) ?? 0}
                checked={p.categoryFilter.includes(c.slug)}
                onChange={() => p.toggleArr(p.categoryFilter, p.setCategoryFilter, c.slug)}
              />
            ))}
        </div>
      </Section>

      <Section title="Price Range" defaultOpen>
        <div className="px-1">
          <DualRange min={0} max={15000} step={250} value={p.price} onChange={p.setPrice} />
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="rounded-full border border-border px-2.5 py-1 font-medium">{inr(p.price[0])}</span>
            <span className="text-muted-foreground">to</span>
            <span className="rounded-full border border-border px-2.5 py-1 font-medium">{inr(p.price[1])}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRICE_CHIPS.map((c) => {
              const active = p.price[0] === c.range[0] && p.price[1] === c.range[1];
              return (
                <button
                  key={c.label}
                  onClick={() => p.setPrice(c.range)}
                  className={`rounded-full border px-3 py-1 text-[11px] transition ${active ? "border-gold bg-gold text-ink" : "border-border hover:border-gold"}`}
                >{c.label}</button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Gender">
        {["men", "women", "kids", "unisex"].map((g) => (
          <CheckRow key={g} label={g} capitalize checked={p.genders.includes(g)} onChange={() => p.toggleArr(p.genders, p.setGenders, g)} />
        ))}
      </Section>

      <Section title="Age Group">
        {[{ k: "kids", l: "Kids" }, { k: "teen", l: "Teen" }, { k: "adult", l: "Adult" }, { k: "adult", l: "Professional" }].map((a, i) => (
          <CheckRow key={`${a.k}-${i}`} label={a.l} checked={p.ages.includes(a.k)} onChange={() => p.toggleArr(p.ages, p.setAges, a.k)} />
        ))}
      </Section>

      <Section title="Brands">
        <div className="mb-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={p.brandQuery}
              onChange={(e) => p.setBrandQuery(e.target.value)}
              placeholder="Search brands"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="max-h-44 overflow-y-auto pr-1">
          {p.allBrands
            .filter((b) => b.toLowerCase().includes(p.brandQuery.toLowerCase()))
            .map((b) => (
              <CheckRow key={b} label={b} checked={p.brands.includes(b)} onChange={() => p.toggleArr(p.brands, p.setBrands, b)} />
            ))}
        </div>
      </Section>

      <Section title="Material">
        <div className="max-h-44 overflow-y-auto pr-1">
          {["Leather", "PU Leather", "Canvas", "Nylon", "Polyester", "Fabric", "Waterproof", "Eco Friendly", ...p.allMaterials.filter((m) => !["Leather", "Nylon", "Canvas", "Polyester"].includes(m))]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((m) => (
              <CheckRow key={m} label={m} checked={p.materials.includes(m)} onChange={() => p.toggleArr(p.materials, p.setMaterials, m)} />
            ))}
        </div>
      </Section>

      <Section title="Colors" defaultOpen>
        <div className="flex flex-wrap gap-2.5">
          {p.allColors.map((c) => {
            const active = p.colors.includes(c);
            const hex = COLOR_MAP[c] ?? "#8b8b8b";
            return (
              <button
                key={c}
                onClick={() => p.toggleArr(p.colors, p.setColors, c)}
                title={c}
                className={`relative size-8 rounded-full border-2 transition ${active ? "border-gold scale-110 shadow-[0_0_0_3px_oklch(0.99_0.01_85)]" : "border-border hover:scale-110"}`}
                style={{ background: hex }}
              >
                {active && <span className="absolute inset-0 grid place-items-center text-cream text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Capacity">
        {["Small", "Medium", "Large", "Extra Large"].map((c) => (
          <CheckRow key={c} label={c} checked={p.capacities.includes(c)} onChange={() => p.toggleArr(p.capacities, p.setCapacities, c)} />
        ))}
      </Section>

      <Section title="Features">
        {["Waterproof", "Laptop Sleeve", "USB Charging", "Anti Theft", "Expandable", "Lightweight", "TSA Lock", "Cabin Friendly", "Wheel Support"].map((f) => (
          <CheckRow key={f} label={f} checked={p.features.includes(f)} onChange={() => p.toggleArr(p.features, p.setFeatures, f)} />
        ))}
      </Section>

      <Section title="Ratings">
        <div className="space-y-1.5">
          {[5, 4, 3].map((r) => (
            <button
              key={r}
              onClick={() => p.setMinRating(p.minRating === r ? 0 : r)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition ${p.minRating === r ? "bg-muted" : "hover:bg-muted/50"}`}
            >
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`size-3.5 ${i < r ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                ))}
              </span>
              <span className="text-xs text-muted-foreground">& up</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Availability">
        {["In Stock", "Out of Stock", "Pre Order"].map((a) => (
          <CheckRow key={a} label={a} checked={p.availability.includes(a)} onChange={() => p.toggleArr(p.availability, p.setAvailability, a)} />
        ))}
      </Section>

      <Section title="Offers">
        {["Discounted", "Festival Offer", "Buy One Get One", "Clearance"].map((a) => (
          <CheckRow key={a} label={a} checked={p.offers.includes(a)} onChange={() => p.toggleArr(p.offers, p.setOffers, a)} />
        ))}
      </Section>

      <Section title="Collections">
        {["New Arrival", "Best Seller", "Premium", "Limited Edition", "Luxury", "Signature"].map((a) => (
          <CheckRow key={a} label={a} checked={p.collections.includes(a)} onChange={() => p.toggleArr(p.collections, p.setCollections, a)} />
        ))}
      </Section>

      {/* Sticky actions */}
      <div className="sticky bottom-0 -mx-2 mt-6 flex gap-2 border-t border-border bg-background/95 px-2 py-3 backdrop-blur">
        <button onClick={p.onReset} className="flex-1 rounded-full border border-border py-2.5 text-xs uppercase tracking-widest hover:border-foreground transition">
          Reset
        </button>
        <button onClick={p.onApply} className="flex-1 rounded-full bg-ink py-2.5 text-xs uppercase tracking-widest text-cream hover:bg-ink/90 transition">
          Apply
        </button>
      </div>
    </div>
  );
}

// ============ Filter primitives ============

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">{title}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100 pt-3" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function CheckRow({ label, count, checked, onChange, capitalize }: { label: string; count?: number; checked: boolean; onChange: () => void; capitalize?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md px-1 py-1 hover:bg-muted/40">
      <span className="flex items-center gap-2">
        <span className={`grid size-4 place-items-center rounded border transition ${checked ? "border-gold bg-gold" : "border-border bg-background"}`}>
          {checked && <span className="text-[10px] leading-none text-ink">✓</span>}
        </span>
        <span className={`text-xs ${capitalize ? "capitalize" : ""}`}>{label}</span>
      </span>
      {typeof count === "number" && <span className="text-[10px] text-muted-foreground">{count}</span>}
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

function DualRange({ min, max, step, value, onChange }: { min: number; max: number; step: number; value: [number, number]; onChange: (v: [number, number]) => void }) {
  const [lo, hi] = value;
  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  return (
    <div className="relative h-8">
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-gold"
        style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
      />
      <input
        type="range" min={min} max={max} step={step} value={lo}
        onChange={(e) => onChange([Math.min(+e.target.value, hi - step), hi])}
        className="dual-range absolute inset-0 w-full appearance-none bg-transparent"
      />
      <input
        type="range" min={min} max={max} step={step} value={hi}
        onChange={(e) => onChange([lo, Math.max(+e.target.value, lo + step)])}
        className="dual-range absolute inset-0 w-full appearance-none bg-transparent"
      />
      <style>{`
        .dual-range { pointer-events: none; }
        .dual-range::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          height: 18px; width: 18px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid var(--gold, #d4af37);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          cursor: pointer;
        }
        .dual-range::-moz-range-thumb {
          pointer-events: auto;
          height: 18px; width: 18px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid var(--gold, #d4af37);
          cursor: pointer;
        }
        .dual-range::-webkit-slider-runnable-track { background: transparent; }
      `}</style>
    </div>
  );
}

// ============ Premium product cards ============

function LuxuryProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWished } = useStore();
  const wished = isWished(product.id);
  const discount = product.was ? Math.round(((product.was - product.price) / product.was) * 100) : 0;
  const lowStock = product.stock > 0 && product.stock < 10;

  return (
    <div className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted ring-1 ring-transparent transition-all duration-500 group-hover:-translate-y-1 group-hover:ring-gold/60 group-hover:shadow-[0_30px_60px_-25px_oklch(0_0_0/0.35)]">
        <Link to="/product/$slug" params={{ slug: product.slug }} aria-label={product.name} className="absolute inset-0 z-0 block">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-0"
          />
          <img
            src={product.images[1] ?? product.images[0]}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full scale-110 object-cover opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.badge && (
            <span className="rounded-full bg-ink/90 px-3 py-1 text-[10px] uppercase tracking-widest text-cream backdrop-blur">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
              -{discount}%
            </span>
          )}
        </div>

        {/* Side actions */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-0 transition-all duration-500 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
          <button
            onClick={() => { toggleWishlist(product.id); toast.success(wished ? "Removed from wishlist" : "Added to wishlist"); }}
            aria-label="Wishlist"
            className={`grid size-9 place-items-center rounded-full backdrop-blur shadow transition ${wished ? "bg-gold text-ink" : "bg-cream/90 text-ink hover:bg-gold hover:text-ink"}`}
          ><Heart className={`size-4 ${wished ? "fill-current" : ""}`} /></button>
          <Link
            to="/product/$slug" params={{ slug: product.slug }}
            aria-label="Quick view"
            className="grid size-9 place-items-center rounded-full bg-cream/90 text-ink shadow backdrop-blur transition hover:bg-gold"
          ><Eye className="size-4" /></Link>
          <button
            onClick={() => toast.message("Added to compare", { description: product.name })}
            aria-label="Compare"
            className="grid size-9 place-items-center rounded-full bg-cream/90 text-ink shadow backdrop-blur transition hover:bg-gold"
          ><GitCompareArrows className="size-4" /></button>
        </div>

        {/* Bottom action bar */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex translate-y-4 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={() => { addToCart(product.id); toast.success("Added to bag", { description: product.name }); }}
            disabled={product.stock <= 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-cream/95 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink backdrop-blur transition hover:bg-cream disabled:opacity-50"
          >
            <ShoppingBag className="size-3.5" /> {product.stock <= 0 ? "Sold Out" : "Add"}
          </button>
          {product.stock > 0 && (
            <Link
              to="/checkout"
              onClick={() => addToCart(product.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-xs font-semibold uppercase tracking-widest text-cream transition hover:bg-ink/90"
            >
              Buy Now
            </Link>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3.5 px-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">{product.brand}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.category}</p>
        </div>
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="mt-1.5 line-clamp-1 text-sm font-medium leading-snug transition hover:text-gold">{product.name}</h3>
        </Link>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-3 ${i < Math.round(product.rating) ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
            ))}
          </span>
          <span className="text-muted-foreground">({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold">{inr(product.price)}</span>
          {product.was && <span className="text-xs text-muted-foreground line-through">{inr(product.was)}</span>}
          {discount > 0 && <span className="text-xs font-semibold text-gold">{discount}% off</span>}
        </div>
        {/* Colors */}
        <div className="mt-2 flex items-center gap-1.5">
          {[product.color, ...Object.keys(COLOR_MAP).slice(0, 2).filter((c) => c !== product.color)].slice(0, 3).map((c) => (
            <span key={c} className="size-3 rounded-full border border-border" style={{ background: COLOR_MAP[c] ?? "#999" }} title={c} />
          ))}
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-widest">
            {product.stock === 0 ? (
              <span className="text-destructive">Out of stock</span>
            ) : lowStock ? (
              <span className="text-gold">Only {product.stock} left</span>
            ) : (
              <span className="text-muted-foreground">In stock</span>
            )}
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Truck className="size-3" /> Free delivery in 3–5 days
        </p>
      </div>
    </div>
  );
}

function ListProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWished } = useStore();
  const wished = isWished(product.id);
  const discount = product.was ? Math.round(((product.was - product.price) / product.was) * 100) : 0;

  return (
    <div className="group flex flex-col gap-5 rounded-2xl border border-border bg-card/40 p-4 transition hover:border-gold/60 hover:shadow-[0_20px_50px_-30px_oklch(0_0_0/0.4)] sm:flex-row">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block sm:w-56">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
          <img src={product.images[0]} alt={product.name} loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
          {discount > 0 && <span className="absolute left-2 top-2 rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink">-{discount}%</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{product.brand}</p>
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="mt-1 font-serif text-xl hover:text-gold">{product.name}</h3>
        </Link>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-3.5 ${i < Math.round(product.rating) ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
            ))}
          </span>
          <span className="text-muted-foreground">{product.rating} · {product.reviewCount} reviews</span>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{inr(product.price)}</span>
            {product.was && <span className="text-sm text-muted-foreground line-through">{inr(product.was)}</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`grid size-10 place-items-center rounded-full border ${wished ? "border-gold bg-gold text-ink" : "border-border hover:border-gold"}`}
              aria-label="Wishlist"
            ><Heart className={`size-4 ${wished ? "fill-current" : ""}`} /></button>
            <button
              onClick={() => { addToCart(product.id); toast.success("Added to bag", { description: product.name }); }}
              className="rounded-full bg-ink px-6 py-2.5 text-xs uppercase tracking-widest text-cream hover:bg-ink/90"
            >Add to bag</button>
            <Link to="/checkout" onClick={() => addToCart(product.id)} className="rounded-full bg-gradient-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink hover:brightness-110">
              Buy Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Carousel ============

function Carousel({ eyebrow, title, items }: { eyebrow: string; title: string; items: Product[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  if (!items.length) return null;
  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gold">{eyebrow}</p>
          <h3 className="mt-2 font-serif text-3xl md:text-4xl">{title}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scrollBy(-1)} aria-label="Previous" className="grid size-10 place-items-center rounded-full border border-border hover:border-gold">
            <ChevronRight className="size-4 rotate-180" />
          </button>
          <button onClick={() => scrollBy(1)} aria-label="Next" className="grid size-10 place-items-center rounded-full border border-border hover:border-gold">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 no-scrollbar">
        {items.map((p) => (
          <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-[30%] xl:w-[23%]">
            <LuxuryProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ============ Empty state ============

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/30 p-12 text-center">
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-gold text-ink shadow-[0_20px_50px_-20px_oklch(0.7_0.12_80/0.55)]">
        <ShoppingBag className="size-10" />
      </div>
      <h3 className="mt-6 font-serif text-3xl">No products match your filters</h3>
      <p className="mt-2 text-sm text-muted-foreground">Try adjusting your selection — your perfect bag is closer than you think.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button onClick={onClear} className="rounded-full bg-ink px-6 py-3 text-xs uppercase tracking-widest text-cream hover:bg-ink/90">
          Clear Filters
        </button>
        <Link to="/shop" search={{ sort: "featured" }} className="rounded-full border border-ink px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink hover:text-cream transition">
          View All Products
        </Link>
      </div>
    </div>
  );
}

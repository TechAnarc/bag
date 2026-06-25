import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES, inr } from "@/lib/catalog";
import { useStore } from "@/lib/store";

type Search = {
  category?: string;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "rating" | "popularity";
  q?: string;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    sort: (s.sort as Search["sort"]) ?? "featured",
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Bags — Triveni Bombay Bag House" },
      { name: "description", content: "Browse the full collection: handbags, backpacks, office, travel, school, wallets and signature pieces." },
    ],
  }),
  component: ShopPage,
});

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
] as const;

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { products } = useStore();

  const allColors = useMemo(() => [...new Set(products.map((p) => p.color))], [products]);
  const allMaterials = useMemo(() => [...new Set(products.map((p) => p.material))], [products]);
  const allBrands = useMemo(() => [...new Set(products.map((p) => p.brand))], [products]);

  const [colors, setColors] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([0, 15000]);
  const [minRating, setMinRating] = useState(0);
  const [onlyNew, setOnlyNew] = useState(false);
  const [onlyBest, setOnlyBest] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [visible, setVisible] = useState(12);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.category) list = list.filter((p) => p.category === search.category);
    if (search.q) list = list.filter((p) => p.name.toLowerCase().includes(search.q!.toLowerCase()));
    if (colors.length) list = list.filter((p) => colors.includes(p.color));
    if (materials.length) list = list.filter((p) => materials.includes(p.material));
    if (brands.length) list = list.filter((p) => brands.includes(p.brand));
    if (genders.length) list = list.filter((p) => genders.includes(p.gender));
    list = list.filter((p) => p.price >= price[0] && p.price <= price[1]);
    if (minRating) list = list.filter((p) => p.rating >= minRating);
    if (onlyNew) list = list.filter((p) => p.isNew);
    if (onlyBest) list = list.filter((p) => p.isBestseller);

    switch (search.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "popularity": list.sort((a, b) => b.reviewCount - a.reviewCount); break;
      case "newest": list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
    return list;
  }, [products, search, colors, materials, brands, genders, price, minRating, onlyNew, onlyBest]);

  const clearAll = () => {
    setColors([]); setMaterials([]); setBrands([]); setGenders([]);
    setPrice([0, 15000]); setMinRating(0); setOnlyNew(false); setOnlyBest(false);
    navigate({ search: { sort: search.sort } });
  };

  const FiltersPanel = (
    <div className="space-y-7 text-sm">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Category</p>
        <div className="space-y-1.5">
          <button
            onClick={() => navigate({ search: { ...search, category: undefined } })}
            className={`block text-left ${!search.category ? "text-gold font-semibold" : "hover:text-foreground/80"}`}
          >All</button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate({ search: { ...search, category: c.slug } })}
              className={`block text-left ${search.category === c.slug ? "text-gold font-semibold" : "hover:text-foreground/80"}`}
            >{c.name}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Price range</p>
        <input type="range" min={0} max={15000} step={500} value={price[1]} onChange={(e) => setPrice([price[0], +e.target.value])} className="w-full accent-[var(--gold)]" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{inr(price[0])}</span><span>{inr(price[1])}</span></div>
      </div>

      <Group title="Gender">
        {["women", "men", "unisex", "kids"].map((g) => (
          <Check key={g} label={g} checked={genders.includes(g)} onChange={() => toggle(genders, setGenders, g)} />
        ))}
      </Group>

      <Group title="Color">{allColors.map((c) => <Check key={c} label={c} checked={colors.includes(c)} onChange={() => toggle(colors, setColors, c)} />)}</Group>
      <Group title="Material">{allMaterials.map((m) => <Check key={m} label={m} checked={materials.includes(m)} onChange={() => toggle(materials, setMaterials, m)} />)}</Group>
      <Group title="Brand">{allBrands.map((b) => <Check key={b} label={b} checked={brands.includes(b)} onChange={() => toggle(brands, setBrands, b)} />)}</Group>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Rating</p>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button key={r} onClick={() => setMinRating(r)} className={`rounded-full border px-3 py-1 text-xs ${minRating === r ? "border-gold bg-gold text-ink" : "border-border"}`}>
              {r === 0 ? "All" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Check label="New arrivals" checked={onlyNew} onChange={() => setOnlyNew(!onlyNew)} />
        <Check label="Best sellers" checked={onlyBest} onChange={() => setOnlyBest(!onlyBest)} />
      </div>

      <button onClick={clearAll} className="w-full rounded-full border border-border py-2 text-xs uppercase tracking-widest hover:border-foreground">Clear all</button>
    </div>
  );

  return (
    <SiteLayout>
      <section className="bg-ink py-12 text-cream">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">The Collection</p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl">
            {search.category ? CATEGORIES.find((c) => c.slug === search.category)?.name ?? "Shop" : "Shop All"}
          </h1>
          <p className="mt-3 max-w-xl text-cream/70">Discover bags engineered for every chapter of life — from the daily commute to grand voyages.</p>
        </div>
      </section>

      {/* category tabs */}
      <div className="border-b border-border bg-background sticky top-16 z-30">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-3 text-xs uppercase tracking-widest no-scrollbar">
          <button
            onClick={() => navigate({ search: { ...search, category: undefined } })}
            className={`shrink-0 rounded-full px-4 py-2 ${!search.category ? "bg-ink text-cream" : "hover:bg-muted"}`}
          >All</button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate({ search: { ...search, category: c.slug } })}
              className={`shrink-0 rounded-full px-4 py-2 ${search.category === c.slug ? "bg-ink text-cream" : "hover:bg-muted"}`}
            >{c.name}</button>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block sticky top-32 self-start">{FiltersPanel}</aside>

          <div>
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{filtered.length}</span> products</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setDrawer(true)} className="lg:hidden flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest">
                  <SlidersHorizontal className="size-4" /> Filters
                </button>
                <div className="relative">
                  <select
                    value={search.sort}
                    onChange={(e) => navigate({ search: { ...search, sort: e.target.value as Search["sort"] } })}
                    className="appearance-none rounded-full border border-border bg-background py-2 pl-4 pr-9 text-xs uppercase tracking-widest"
                  >
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <p className="font-serif text-2xl">No bags found</p>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
                <button onClick={clearAll} className="mt-5 rounded-full bg-ink px-6 py-2 text-xs uppercase tracking-widest text-cream">Reset filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                  {filtered.slice(0, visible).map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {visible < filtered.length && (
                  <div className="mt-12 flex justify-center">
                    <button onClick={() => setVisible(visible + 12)} className="rounded-full border border-ink px-8 py-3 text-xs uppercase tracking-widest hover:bg-ink hover:text-cream transition">
                      Load more ({filtered.length - visible} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {drawer && (
        <div className="fixed inset-0 z-[55] bg-black/60 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <p className="font-serif text-xl">Filters</p>
              <button onClick={() => setDrawer(false)}><X className="size-5" /></button>
            </div>
            {FiltersPanel}
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm capitalize">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-[var(--gold)]" />
      <span>{label}</span>
    </label>
  );
}

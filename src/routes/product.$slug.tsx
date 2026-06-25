import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, RefreshCcw, ShieldCheck, Share2, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import { inr } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/product/$slug")({
  component: PDP,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-serif text-4xl">Product not found</h1>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-xs uppercase tracking-widest text-cream">Continue shopping</Link>
      </div>
    </SiteLayout>
  ),
});

function PDP() {
  const { slug } = Route.useParams();
  const { products, addToCart, toggleWishlist, isWished, pushRecent, recent } = useStore();
  const product = products.find((p) => p.slug === slug);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "specs" | "reviews" | "shipping" | "faq">("desc");
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (product) pushRecent(product.id);
  }, [product?.id]); // eslint-disable-line

  const related = useMemo(
    () => (product ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4) : []),
    [products, product],
  );
  const recentItems = recent.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 4) as typeof products;

  if (!product) throw notFound();
  const wished = isWished(product.id);
  const stockLabel = product.stock > 10 ? "In Stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of Stock";

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> / <Link to="/shop" className="hover:text-foreground">Shop</Link> / <Link to="/shop" search={{ category: product.category } as never} className="hover:text-foreground capitalize">{product.category}</Link> / <span className="text-foreground">{product.name}</span>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted group">
            <img src={product.images[activeImg]} alt={product.name} className="size-full object-cover" />
            <button onClick={() => setZoom(true)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-background/90 backdrop-blur hover:bg-background"><Maximize2 className="size-4" /></button>
            <span className="absolute left-3 top-3 rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">Luxury</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {product.images.map((src, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden rounded-lg border-2 ${activeImg === i ? "border-gold" : "border-transparent"}`}>
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{product.brand}</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><Star className="size-4 fill-gold text-gold" /> {product.rating}</span>
            <span className="text-muted-foreground">· {product.reviewCount} reviews</span>
            <span className="text-muted-foreground">· SKU {product.id.toUpperCase()}</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-3xl">{inr(product.price)}</span>
            {product.was && <>
              <span className="text-base text-muted-foreground line-through">{inr(product.was)}</span>
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold-dark">
                Save {inr(product.was - product.price)}
              </span>
            </>}
          </div>
          <p className={`mt-3 text-sm font-medium ${product.stock > 0 ? "text-emerald-700" : "text-destructive"}`}>● {stockLabel}</p>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
            <Spec k="Material" v={product.material} />
            <Spec k="Color" v={product.color} />
            <Spec k="Size" v={product.size} />
            <Spec k="Warranty" v="1 Year" />
          </dl>

          <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid size-10 place-items-center"><Minus className="size-4" /></button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="grid size-10 place-items-center"><Plus className="size-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 18) + 7} sold in last 24h</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => { addToCart(product.id, qty); toast.success("Added to bag", { description: product.name }); }}
              className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-xs uppercase tracking-widest text-cream hover:bg-ink/90"
            ><ShoppingBag className="size-4" /> Add to Bag</button>
            <Link
              to="/checkout"
              onClick={() => addToCart(product.id, qty)}
              className="flex items-center justify-center rounded-full bg-gradient-gold py-3.5 text-xs uppercase tracking-widest text-ink hover:opacity-90"
            >Buy Now</Link>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-xs uppercase tracking-widest ${wished ? "border-gold bg-gold/10 text-gold-dark" : "border-border"}`}
            ><Heart className={`size-4 ${wished ? "fill-current" : ""}`} /> {wished ? "Wishlisted" : "Add to Wishlist"}</button>
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); toast("Link copied"); }}
              className="flex items-center justify-center gap-2 rounded-full border border-border px-5 text-xs uppercase tracking-widest"
            ><Share2 className="size-4" /> Share</button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            <Perk icon={Truck} t="Free shipping" s="On orders ₹2,499+" />
            <Perk icon={RefreshCcw} t="7-day returns" s="Easy & free" />
            <Perk icon={ShieldCheck} t="Secure checkout" s="Bank-grade SSL" />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="border-b border-border">
          <div className="flex gap-6 overflow-x-auto text-sm">
            {[
              ["desc", "Description"], ["specs", "Specifications"], ["reviews", `Reviews (${product.reviewCount})`],
              ["shipping", "Shipping"], ["faq", "FAQs"],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k as never)} className={`shrink-0 border-b-2 py-3 text-sm tracking-wider ${tab === k ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="prose prose-neutral max-w-3xl py-8 text-sm leading-relaxed text-muted-foreground">
          {tab === "desc" && <p>{product.description} Crafted in our atelier with premium {product.material.toLowerCase()}, the {product.name} is built to be a daily companion that ages with grace and confidence.</p>}
          {tab === "specs" && (
            <ul className="grid grid-cols-2 gap-y-2">
              <li><b className="text-foreground">Material:</b> {product.material}</li>
              <li><b className="text-foreground">Color:</b> {product.color}</li>
              <li><b className="text-foreground">Size:</b> {product.size}</li>
              <li><b className="text-foreground">Gender:</b> <span className="capitalize">{product.gender}</span></li>
              <li><b className="text-foreground">Warranty:</b> 1 Year manufacturer</li>
              <li><b className="text-foreground">SKU:</b> {product.id.toUpperCase()}</li>
            </ul>
          )}
          {tab === "reviews" && (
            <div className="space-y-4">
              {[
                { n: "Priya M.", r: 5, c: "Absolutely loved it — looks even better in person." },
                { n: "Aman K.", r: 5, c: "Premium feel. Worth every rupee." },
                { n: "Ritu S.", r: 4, c: "Great build quality, slightly heavier than expected." },
              ].map((rev, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{rev.n}</p>
                    <div className="flex">{Array.from({ length: rev.r }).map((_, j) => <Star key={j} className="size-3.5 fill-gold text-gold" />)}</div>
                  </div>
                  <p className="mt-2">{rev.c}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "shipping" && <p>Free standard shipping on orders over ₹2,499. Express shipping available at checkout. Delivered within 2–6 business days across India.</p>}
          {tab === "faq" && (
            <div className="space-y-3">
              <details className="rounded border border-border p-4"><summary className="cursor-pointer font-medium text-foreground">Is this product genuine?</summary><p className="mt-2">Yes, every TBH product is 100% authentic and crafted in our own atelier.</p></details>
              <details className="rounded border border-border p-4"><summary className="cursor-pointer font-medium text-foreground">What's the return policy?</summary><p className="mt-2">7-day no-questions-asked returns. See our returns page.</p></details>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <h2 className="font-serif text-3xl">You may also love</h2>
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      {recentItems.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <h2 className="font-serif text-3xl">Recently viewed</h2>
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">{recentItems.filter(p => p.id !== product.id).slice(0,4).map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-6" onClick={() => setZoom(false)}>
          <img src={product.images[activeImg]} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </SiteLayout>
  );
}

const Spec = ({ k, v }: { k: string; v: string }) => (
  <div>
    <dt className="text-xs uppercase tracking-widest text-muted-foreground">{k}</dt>
    <dd className="mt-0.5 text-sm">{v}</dd>
  </div>
);

const Perk = ({ icon: Icon, t, s }: { icon: typeof Truck; t: string; s: string }) => (
  <div className="rounded-xl border border-border p-3 text-center">
    <Icon className="mx-auto size-5 text-gold" />
    <p className="mt-1.5 font-medium text-foreground">{t}</p>
    <p className="text-[11px] text-muted-foreground">{s}</p>
  </div>
);

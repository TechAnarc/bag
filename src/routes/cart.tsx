import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2, Tag, Truck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import { inr } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import api from "@/lib/axios";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Bag — Triveni Bombay Bag House" }] }),
  component: CartPage,
});

function CartPage() {
  const { cart, products, setQty, removeFromCart, cartSubtotal } = useStore();
  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id)! })).filter((i) => i.product);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const recommendations = products.filter((p) => !cart.find((c) => c.id === p.id)).slice(0, 4);
  const shipping = cartSubtotal > 2499 || cartSubtotal === 0 ? 0 : 99;
  const total = Math.max(0, cartSubtotal + shipping - discount);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    if (appliedCode === code) { toast.info("Coupon already applied"); return; }
    setIsApplying(true);
    try {
      const res = await api.post("/coupons/validate", { code, itemTotal: cartSubtotal });
      const data = res.data?.data;
      if (data?.isFreeShipping) {
        setDiscount(shipping);
        toast.success("Free shipping applied!");
      } else {
        setDiscount(data?.discountAmount ?? 0);
        const fmt = data?.type === "PERCENTAGE" ? `${data?.type} ${data?.value}% off` : `₹${data?.discountAmount} off`;
        toast.success(`Coupon applied · ${fmt}`);
      }
      setAppliedCode(code);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid coupon";
      toast.error(msg);
      setDiscount(0);
      setAppliedCode(null);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl">Your Bag</h1>
        <p className="mt-2 text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>

        {items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border py-24 text-center">
            <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 font-serif text-2xl">Your bag is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Let's find something you'll love.</p>
            <Link to="/shop" className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-xs uppercase tracking-widest text-cream">Shop the collection</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-border">
              {items.map(({ id, qty, product }) => (
                <li key={id} className="flex gap-4 py-6">
                  <Link to="/product/$slug" params={{ slug: product.slug }} className="size-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={product.images[0]} alt="" className="size-full object-cover" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{product.brand}</p>
                        <Link to="/product/$slug" params={{ slug: product.slug }} className="font-medium hover:text-gold">{product.name}</Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">{product.color} · {product.size}</p>
                      </div>
                      <p className="font-semibold">{inr(product.price * qty)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => setQty(id, qty - 1)} className="grid size-8 place-items-center"><Minus className="size-3.5" /></button>
                        <span className="w-8 text-center text-sm">{qty}</span>
                        <button onClick={() => setQty(id, qty + 1)} className="grid size-8 place-items-center"><Plus className="size-3.5" /></button>
                      </div>
                      <button onClick={() => removeFromCart(id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /> Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-32">
              <p className="font-serif text-xl">Order summary</p>
              <div className="mt-5 space-y-2 text-sm">
                <Row k="Subtotal" v={inr(cartSubtotal)} />
                <Row k="Shipping" v={shipping === 0 ? "Free" : inr(shipping)} />
                {discount > 0 && <Row k="Discount" v={`- ${inr(discount)}`} accent />}
              </div>
              <div className="mt-4 flex border-t border-border pt-4 text-base font-semibold">
                <span>Total</span><span className="ml-auto">{inr(total)}</span>
              </div>

              <div className="mt-5 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} placeholder="Promo / coupon code" className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-xs" />
                </div>
                <button onClick={applyCoupon} disabled={isApplying} className="rounded-full bg-ink px-4 text-xs uppercase tracking-widest text-cream disabled:opacity-60">{isApplying ? "..." : "Apply"}</button>
              </div>
              {appliedCode && <p className="mt-1 text-[11px] text-emerald-600">✓ Code <strong>{appliedCode}</strong> applied</p>}

              <Link to="/checkout" search={{ couponCode: appliedCode ?? undefined }} className="mt-5 grid place-items-center rounded-full bg-gradient-gold py-3.5 text-xs uppercase tracking-widest text-ink">Checkout</Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Truck className="size-3.5" /> Free shipping over ₹2,499</p>
            </aside>
          </div>
        )}

        {recommendations.length > 0 && (
          <section className="mt-20">
            <h2 className="font-serif text-3xl">You may also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">{recommendations.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}

const Row = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{k}</span>
    <span className={accent ? "text-gold-dark font-medium" : ""}>{v}</span>
  </div>
);

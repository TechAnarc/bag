import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { inr } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Triveni Bombay Bag House" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, products, toggleWishlist, addToCart } = useStore();
  const items = wishlist.map((id) => products.find((p) => p.id === id)).filter(Boolean) as typeof products;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl">Wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">{items.length} saved</p>

        {items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border py-24 text-center">
            <Heart className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 font-serif text-2xl">Your wishlist is empty</p>
            <Link to="/shop" className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-xs uppercase tracking-widest text-cream">Browse the collection</Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {items.map((p) => (
              <div key={p.id} className="group">
                <Link to="/product/$slug" params={{ slug: p.slug }} className="block aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                  <img src={p.images[0]} alt="" className="size-full object-cover transition group-hover:scale-105" />
                </Link>
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{p.brand}</p>
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-0.5 text-sm font-semibold">{inr(p.price)}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { addToCart(p.id); toast.success("Added to bag"); }} className="flex-1 rounded-full bg-ink py-2 text-xs uppercase tracking-widest text-cream"><ShoppingBag className="mr-1 inline size-3.5" /> Add</button>
                  <button onClick={() => toggleWishlist(p.id)} className="rounded-full border border-border px-3 text-xs">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

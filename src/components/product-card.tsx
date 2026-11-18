import { Link } from "@tanstack/react-router";
import { Eye, Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { inr, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWished } = useStore();
  const wished = isWished(product.id);

  return (
    <div className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <Link to="/product/$slug" params={{ slug: product.slug }} aria-label={product.name} className="absolute inset-0 z-0 block">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-0"
          />
          <img
            src={product.images[1] ?? product.images[0]}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        </Link>
        {product.badge && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-ink/90 px-3 py-1 text-[10px] uppercase tracking-widest text-cream">
            {product.badge}
          </span>
        )}
        {product.was && (
          <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
            -{Math.round(((product.was - product.price) / product.was) * 100)}%
          </span>
        )}
        <div className="absolute inset-x-3 bottom-3 z-10 flex translate-y-3 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={() => {
              addToCart(product.id);
              toast.success("Added to bag", { description: product.name });
            }}
            disabled={product.stock <= 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-xs font-medium uppercase tracking-widest text-cream hover:bg-ink/90 disabled:opacity-50"
          >
            <ShoppingBag className="size-3.5" /> {product.stock <= 0 ? "Sold Out" : "Add"}
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label="Wishlist"
            className={`grid size-10 place-items-center rounded-full border ${wished ? "border-gold bg-gold text-ink" : "border-border bg-background"} hover:border-gold`}
          >
            <Heart className={`size-4 ${wished ? "fill-current" : ""}`} />
          </button>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            aria-label="Quick view"
            className="grid size-10 place-items-center rounded-full border border-border bg-background hover:border-gold"
          >
            <Eye className="size-4" />
          </Link>
        </div>
      </div>
      <div className="mt-3 px-1">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{product.brand}</p>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="mt-1 block">
          <h3 className="text-sm font-medium leading-snug line-clamp-1 hover:text-gold">{product.name}</h3>
        </Link>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{inr(product.price)}</span>
            {product.was && <span className="text-xs text-muted-foreground line-through">{inr(product.was)}</span>}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-gold text-gold" />
            {product.rating}
          </span>
        </div>
      </div>
    </div>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Instagram, MapPin, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/logo-tbh.png";
import { useStore } from "@/lib/store";
import { CATEGORIES, inr } from "@/lib/catalog";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop", label: "Women", search: { category: "handbags" } },
  { to: "/shop", label: "Travel", search: { category: "travel" } },
  { to: "/shop", label: "Office", search: { category: "office" } },
  { to: "/shop", label: "School", search: { category: "school" } },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products } = useStore();
  const [q, setQ] = useState("");
  useEffect(() => {
    if (open) setQ("");
  }, [open]);
  if (!open) return null;
  const results = q.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto mt-24 max-w-2xl rounded-2xl bg-background p-6 shadow-luxe" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Search className="size-5 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for bags, collections, brands…"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        {!q && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Trending</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Saffiano Tote", "Trolley 20\"", "Office Laptop", "School Bag", "Sling", "Signature Gold"].map((t) => (
                <button key={t} onClick={() => setQ(t)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-gold hover:text-gold transition">
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        {results.length > 0 && (
          <ul className="mt-3 divide-y divide-border">
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  onClick={onClose}
                  className="flex items-center gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded"
                >
                  <img src={p.images[0]} alt="" className="size-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} · {p.color}</p>
                  </div>
                  <span className="text-sm font-semibold">{inr(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { cartCount, wishlist } = useStore();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setMobile(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="bg-ink text-cream text-[11px] tracking-wider">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <span className="hidden sm:inline">Complimentary shipping on orders over ₹2,499</span>
          <span className="opacity-80">Concierge: +91 98000 00000</span>
        </div>
      </div>
      <header className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-background/95 backdrop-blur shadow-sm" : "bg-background"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <button className="lg:hidden" onClick={() => setMobile(true)} aria-label="Menu"><Menu className="size-5" /></button>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="TBH" className="h-9 w-auto" />
            <span className="hidden sm:block text-[15px] font-serif font-medium tracking-wide">Triveni Bombay Bag House</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7">
            {NAV.slice(0, 6).map((n, i) => (
              <Link
                key={i}
                to={n.to}
                search={n.search as never}
                className="text-[13px] uppercase tracking-[0.14em] text-foreground/80 hover:text-foreground transition"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearch(true)} aria-label="Search" className="rounded-full p-2 hover:bg-muted"><Search className="size-5" /></button>
            <Link to="/account" aria-label="Account" className="rounded-full p-2 hover:bg-muted"><User className="size-5" /></Link>
            <Link to="/wishlist" aria-label="Wishlist" className="relative rounded-full p-2 hover:bg-muted">
              <Heart className="size-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-ink">{wishlist.length}</span>
              )}
            </Link>
            <Link to="/cart" aria-label="Cart" className="relative rounded-full p-2 hover:bg-muted">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-ink">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {mobile && (
        <div className="fixed inset-0 z-[55] bg-black/60" onClick={() => setMobile(false)}>
          <div className="h-full w-72 bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobile(false)} className="mb-6"><X className="size-5" /></button>
            <nav className="flex flex-col gap-4">
              {NAV.map((n, i) => (
                <Link key={i} to={n.to} search={n.search as never} className="text-sm uppercase tracking-widest">{n.label}</Link>
              ))}
              <Link to="/account" className="text-sm uppercase tracking-widest">Account</Link>
              <Link to="/wishlist" className="text-sm uppercase tracking-widest">Wishlist</Link>
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="TBH" className="h-10 w-auto" />
            <span className="font-serif text-lg">Triveni Bombay</span>
          </div>
          <p className="mt-4 text-sm text-cream/70">Your destination for every bag. Premium craftsmanship since day one.</p>
          <div className="mt-5 flex items-center gap-3 text-cream/70">
            <a href="https://instagram.com/triveni_bombay_bag_house" target="_blank" rel="noreferrer" className="hover:text-gold"><Instagram className="size-5" /></a>
            <a href="tel:+919800000000" className="hover:text-gold"><Phone className="size-5" /></a>
            <a href="#" className="hover:text-gold"><MapPin className="size-5" /></a>
          </div>
        </div>
        <div>
          <p className="font-serif text-sm uppercase tracking-widest text-gold">Shop</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {CATEGORIES.slice(0, 6).map((c) => (
              <li key={c.slug}><Link to="/shop" search={{ category: c.slug } as never} className="hover:text-gold">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-serif text-sm uppercase tracking-widest text-gold">Help</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li><Link to="/policy/$slug" params={{ slug: "shipping" }} className="hover:text-gold">Shipping</Link></li>
            <li><Link to="/policy/$slug" params={{ slug: "returns" }} className="hover:text-gold">Returns</Link></li>
            <li><Link to="/policy/$slug" params={{ slug: "privacy" }} className="hover:text-gold">Privacy</Link></li>
            <li><Link to="/policy/$slug" params={{ slug: "terms" }} className="hover:text-gold">Terms</Link></li>
            <li><Link to="/faq" className="hover:text-gold">FAQ</Link></li>
            <li><Link to="/track" className="hover:text-gold">Track order</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-serif text-sm uppercase tracking-widest text-gold">Newsletter</p>
          <p className="mt-4 text-sm text-cream/80">First access to new arrivals and private sales.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex">
            <input type="email" required placeholder="Email address" className="flex-1 rounded-l-md border border-cream/20 bg-transparent px-3 py-2 text-sm placeholder:text-cream/40 outline-none focus:border-gold" />
            <button className="rounded-r-md bg-gradient-gold px-4 text-sm font-medium text-ink">Join</button>
          </form>
          <p className="mt-6 text-xs text-cream/60">
            <Link to="/admin" className="hover:text-gold">Admin panel →</Link>
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} Triveni Bombay Bag House. Crafted with care.
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { User, MapPin, CreditCard, Package, Heart, Bell, Lock, Star, Gift, LogOut } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/catalog";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Triveni Bombay Bag House" }] }),
  component: AccountPage,
});

const NAV = [
  { k: "dashboard", icon: User, label: "Dashboard" },
  { k: "orders", icon: Package, label: "Orders" },
  { k: "wishlist", icon: Heart, label: "Wishlist" },
  { k: "addresses", icon: MapPin, label: "Addresses" },
  { k: "cards", icon: CreditCard, label: "Saved cards" },
  { k: "reviews", icon: Star, label: "Reviews" },
  { k: "notifications", icon: Bell, label: "Notifications" },
  { k: "security", icon: Lock, label: "Security" },
] as const;

function AccountPage() {
  const [tab, setTab] = useState<typeof NAV[number]["k"]>("dashboard");
  const { wishlist, products } = useStore();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Welcome back</p>
            <h1 className="mt-1 font-serif text-4xl">Hello, Aanya</h1>
          </div>
          <Link to="/auth" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><LogOut className="size-4" /> Sign out</Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-1">
            {NAV.map((n) => (
              <button key={n.k} onClick={() => setTab(n.k)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm ${tab === n.k ? "bg-ink text-cream" : "hover:bg-muted"}`}>
                <n.icon className="size-4" /> {n.label}
              </button>
            ))}
          </aside>

          <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
            {tab === "dashboard" && (
              <div>
                <h2 className="font-serif text-2xl">Dashboard</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Stat icon={Package} k="Orders" v="12" />
                  <Stat icon={Heart} k="Wishlist" v={String(wishlist.length)} />
                  <Stat icon={Gift} k="Reward points" v="1,250" />
                </div>
                <h3 className="mt-8 font-serif text-xl">Recent orders</h3>
                <div className="mt-3 space-y-3">
                  {[
                    { id: "TBH4F92A", date: "12 Jun 2026", total: 9480, status: "Delivered" },
                    { id: "TBH3A11B", date: "02 May 2026", total: 3690, status: "In transit" },
                  ].map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                      <div>
                        <p className="text-sm font-medium">#{o.id}</p>
                        <p className="text-xs text-muted-foreground">{o.date}</p>
                      </div>
                      <p className="text-sm">{inr(o.total)}</p>
                      <span className="rounded-full bg-gold/15 px-3 py-1 text-xs text-gold-dark">{o.status}</span>
                    </div>
                  ))}
                </div>
                <h3 className="mt-8 font-serif text-xl">Coupons for you</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-dashed border-gold p-4">
                    <p className="text-xs uppercase tracking-widest text-gold">TBH10</p>
                    <p className="mt-1 font-medium">10% off your next order</p>
                  </div>
                  <div className="rounded-xl border border-dashed border-gold p-4">
                    <p className="text-xs uppercase tracking-widest text-gold">FREESHIP</p>
                    <p className="mt-1 font-medium">Free express shipping</p>
                  </div>
                </div>
              </div>
            )}

            {tab === "orders" && (
              <div>
                <h2 className="font-serif text-2xl">Orders</h2>
                <div className="mt-5 space-y-3">
                  {[
                    { id: "TBH4F92A", items: 3, total: 9480, status: "Delivered" },
                    { id: "TBH3A11B", items: 1, total: 3690, status: "In transit" },
                    { id: "TBH2C0E1", items: 2, total: 5780, status: "Delivered" },
                  ].map((o) => (
                    <div key={o.id} className="rounded-xl border border-border p-4">
                      <div className="flex justify-between">
                        <p className="font-medium">#{o.id}</p>
                        <span className="text-xs rounded-full bg-muted px-2 py-1">{o.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{o.items} items · {inr(o.total)}</p>
                      <Link to="/track" className="mt-3 inline-block text-xs uppercase tracking-widest text-gold">Track order →</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "wishlist" && (
              <div>
                <h2 className="font-serif text-2xl">Wishlist</h2>
                <p className="mt-2 text-sm text-muted-foreground">You have {wishlist.length} saved items.</p>
                <Link to="/wishlist" className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-xs uppercase tracking-widest text-cream">View wishlist</Link>
              </div>
            )}

            {tab === "addresses" && (
              <div>
                <h2 className="font-serif text-2xl">Address book</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Address title="Home" body="22 Marine Drive, Mumbai, Maharashtra 400020" />
                  <Address title="Office" body="Tower B, BKC, Mumbai, Maharashtra 400051" />
                </div>
              </div>
            )}

            {tab === "cards" && <Placeholder title="Saved cards" body="Securely save cards via Razorpay once payments are enabled." />}
            {tab === "reviews" && <Placeholder title="Your reviews" body="Reviews you write will appear here." />}
            {tab === "notifications" && <Placeholder title="Notifications" body="Order updates and offers will appear here." />}
            {tab === "security" && (
              <div>
                <h2 className="font-serif text-2xl">Security</h2>
                <p className="mt-2 text-sm text-muted-foreground">Manage your password and two-factor authentication.</p>
                <button className="mt-4 rounded-full border border-border px-5 py-2 text-xs uppercase tracking-widest">Change password</button>
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

const Stat = ({ icon: Icon, k, v }: { icon: typeof User; k: string; v: string }) => (
  <div className="rounded-xl border border-border bg-background p-5">
    <Icon className="size-5 text-gold" />
    <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{k}</p>
    <p className="mt-1 font-serif text-2xl">{v}</p>
  </div>
);

const Address = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-xl border border-border p-4">
    <p className="text-xs uppercase tracking-widest text-gold">{title}</p>
    <p className="mt-1 text-sm">{body}</p>
    <div className="mt-3 flex gap-3 text-xs">
      <button className="text-foreground/80 hover:text-foreground">Edit</button>
      <button className="text-muted-foreground hover:text-destructive">Delete</button>
    </div>
  </div>
);

const Placeholder = ({ title, body }: { title: string; body: string }) => (
  <div>
    <h2 className="font-serif text-2xl">{title}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{body}</p>
  </div>
);

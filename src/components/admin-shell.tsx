import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Layers3, Boxes, Users, Star,
  Ticket, Image, Megaphone, Mail, BarChart3, FileText, CreditCard, Truck,
  Undo2, Settings, User, LogOut, Search, Bell, Sun, Moon, Plus, Menu, X,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/axios";

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
export const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Layers3 },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/inquiries", label: "Inquiries", icon: Mail },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/shipping", label: "Shipping", icon: Truck },
  { to: "/admin/returns", label: "Returns", icon: Undo2 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/profile", label: "Profile", icon: User },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const API_BASE = API_BASE_URL;

  const signOut = async () => {
    const token = localStorage.getItem("admin_access_token");
    try {
      if (token) {
        await fetch(`${API_BASE}/admin/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
      }
    } catch { /* silent — always log out locally */ } finally {
      localStorage.removeItem("admin_access_token");
      toast.success("Signed out");
      window.location.href = "/admin-signin";
    }
  };

  return (
    <div className={`min-h-screen ${dark ? "dark bg-[#0a0a0b] text-cream" : "bg-[#faf7f2] text-ink"}`}>
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-black/90 px-4 py-3 text-cream lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menu"><Menu className="size-5" /></button>
        <div className="font-serif text-lg tracking-widest text-gold">TBH ADMIN</div>
        <button onClick={signOut} aria-label="Sign out"><LogOut className="size-5" /></button>
      </div>

      <div className="flex">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/5 bg-[#0b0b0d] text-cream transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link to="/admin" className="font-serif text-lg tracking-widest text-gold">TBH · ADMIN</Link>
            <button onClick={() => setOpen(false)} className="lg:hidden"><X className="size-5" /></button>
          </div>
          <nav className="scrollbar-thin flex h-[calc(100vh-4rem)] flex-col gap-0.5 overflow-y-auto p-3 pb-24 text-sm">
            {NAV.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to as any}
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    active
                      ? "bg-gradient-to-r from-gold/30 to-gold/5 text-gold shadow-inner ring-1 ring-gold/30"
                      : "text-cream/70 hover:bg-white/5 hover:text-cream"
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-gold" : ""}`} />
                  <span className="tracking-wide">{label}</span>
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-cream/60 transition hover:bg-red-950/40 hover:text-red-300"
            >
              <LogOut className="size-4" /> Logout
            </button>
            <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-cream/50">
              <p className="text-gold">Triveni Bombay Bag House</p>
              <p className="mt-1">Enterprise Console v1.0</p>
            </div>
          </nav>
        </aside>
        {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}

        {/* MAIN */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* TOPBAR */}
          <header className="sticky top-0 z-30 hidden h-16 items-center gap-4 border-b border-black/5 bg-white/70 px-6 backdrop-blur-xl lg:flex dark:border-white/5 dark:bg-black/40">
            <div className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
              <input
                placeholder="Search orders, products, customers…"
                className="h-10 w-full rounded-full border border-black/10 bg-white/60 pl-10 pr-4 text-sm outline-none placeholder:text-black/40 focus:border-gold dark:border-white/10 dark:bg-white/5 dark:text-cream"
              />
            </div>
            <div className="text-xs text-black/50 dark:text-white/50">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <button
              onClick={() => setDark(!dark)}
              className="grid size-9 place-items-center rounded-full border border-black/10 bg-white/60 text-black/70 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-cream"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button className="relative grid size-9 place-items-center rounded-full border border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/5" aria-label="Notifications">
              <Bell className="size-4" />
            </button>
            <Link
              to={"/admin/products" as any}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-ink hover:opacity-90"
            >
              <Plus className="size-3.5" /> Quick create
            </Link>
          </header>

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, description, actions, action }: { title: string; subtitle?: string; description?: string; actions?: ReactNode; action?: ReactNode }) {
  const subText = subtitle || description;
  const actionBtns = actions || action;
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">{title}</h1>
        {subText && <p className="mt-1 text-sm text-black/60 dark:text-cream/60">{subText}</p>}
      </div>
      {actionBtns && <div className="flex flex-wrap gap-2">{actionBtns}</div>}
    </div>
  );
}

export function EmptyState({ title, hint, description, action }: { title: string; hint?: string; description?: string; action?: ReactNode }) {
  const hintText = hint || description;
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white/40 p-16 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-gold/30 to-transparent">
        <Package className="size-6 text-gold" />
      </div>
      <p className="mt-4 font-serif text-xl">{title}</p>
      {hintText && <p className="mt-1 text-sm text-black/50 dark:text-cream/50">{hintText}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white/70 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

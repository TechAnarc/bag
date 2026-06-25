import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, RefreshCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { CATEGORIES, inr, loadProducts, resetProducts, saveProducts, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Triveni Bombay Bag House" }] }),
  component: AdminPage,
});

const empty = (): Product => ({
  id: "p-" + Math.random().toString(36).slice(2, 8),
  slug: "",
  name: "",
  category: "handbags",
  gender: "unisex",
  ageGroup: "adult",
  price: 0,
  brand: "TBH Maison",
  color: "",
  material: "",
  size: "",
  rating: 5,
  reviewCount: 0,
  stock: 10,
  description: "",
  images: [""],
});

function AdminPage() {
  const { products, refreshProducts } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q],
  );

  const upsert = (p: Product) => {
    const list = loadProducts();
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const next = { ...p, slug, images: p.images.filter(Boolean) };
    if (!next.images.length) {
      toast.error("At least one image URL is required");
      return;
    }
    const i = list.findIndex((x) => x.id === p.id);
    if (i === -1) list.push(next); else list[i] = next;
    saveProducts(list);
    refreshProducts();
    setEditing(null);
    toast.success("Saved");
  };

  const remove = (id: string) => {
    if (!confirm("Delete this product?")) return;
    saveProducts(loadProducts().filter((p) => p.id !== id));
    refreshProducts();
    toast.success("Deleted");
  };

  const reset = () => {
    if (!confirm("Reset to seed catalog? Custom edits will be lost.")) return;
    resetProducts();
    refreshProducts();
    toast.success("Catalog reset");
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="mt-1 font-serif text-4xl">Product management</h1>
            <p className="mt-1 text-xs text-muted-foreground">Local storage demo · No login required. {products.length} products.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-foreground"><RefreshCcw className="size-3.5" /> Reset</button>
            <button onClick={() => setEditing(empty())} className="flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2 text-xs uppercase tracking-widest text-ink"><Plus className="size-4" /> Add product</button>
          </div>
        </div>

        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="mt-6 w-full max-w-md rounded-full border border-border bg-background px-5 py-2.5 text-sm outline-none focus:border-gold" />

        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="size-10 rounded object-cover" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3">{inr(p.price)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link to="/product/$slug" params={{ slug: p.slug }} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">View</Link>
                      <button onClick={() => setEditing(p)} className="rounded border border-border p-1.5 hover:bg-muted"><Pencil className="size-3.5" /></button>
                      <button onClick={() => remove(p.id)} className="rounded border border-border p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <EditModal product={editing} onClose={() => setEditing(null)} onSave={upsert} />}
    </SiteLayout>
  );
}

function EditModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) {
  const [p, setP] = useState(product);
  const update = <K extends keyof Product>(k: K, v: Product[K]) => setP({ ...p, [k]: v });

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-serif text-2xl">{product.name ? "Edit product" : "New product"}</p>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <F label="Name" v={p.name} onChange={(v) => update("name", v)} className="md:col-span-2" />
          <F label="Brand" v={p.brand} onChange={(v) => update("brand", v)} />
          <Select label="Category" v={p.category} onChange={(v) => update("category", v)} options={CATEGORIES.map((c) => [c.slug, c.name])} />
          <Select label="Gender" v={p.gender} onChange={(v) => update("gender", v as Product["gender"])} options={[["women","Women"],["men","Men"],["unisex","Unisex"],["kids","Kids"]]} />
          <F label="Color" v={p.color} onChange={(v) => update("color", v)} />
          <F label="Material" v={p.material} onChange={(v) => update("material", v)} />
          <F label="Size" v={p.size} onChange={(v) => update("size", v)} />
          <F label="Price (₹)" type="number" v={String(p.price)} onChange={(v) => update("price", +v)} />
          <F label="Was price (₹) — optional" type="number" v={String(p.was ?? "")} onChange={(v) => update("was", v ? +v : undefined)} />
          <F label="Stock" type="number" v={String(p.stock)} onChange={(v) => update("stock", +v)} />
          <F label="Rating" type="number" v={String(p.rating)} onChange={(v) => update("rating", +v)} />
          <F label="Reviews" type="number" v={String(p.reviewCount)} onChange={(v) => update("reviewCount", +v)} />
          <F label="Badge (optional)" v={p.badge ?? ""} onChange={(v) => update("badge", v || undefined)} className="md:col-span-2" />
          <label className="md:col-span-2 block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Description</span>
            <textarea value={p.description} onChange={(e) => update("description", e.target.value)} rows={3} className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />
          </label>
          <label className="md:col-span-2 block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Image URLs (one per line)</span>
            <textarea
              value={p.images.join("\n")}
              onChange={(e) => update("images", e.target.value.split("\n"))}
              rows={4}
              placeholder="https://images.unsplash.com/photo-..."
              className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </label>
          <div className="md:col-span-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.isNew} onChange={(e) => update("isNew", e.target.checked)} /> New</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.isBestseller} onChange={(e) => update("isBestseller", e.target.checked)} /> Bestseller</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-border px-6 py-2 text-xs uppercase tracking-widest">Cancel</button>
          <button onClick={() => onSave(p)} className="rounded-full bg-gradient-gold px-6 py-2 text-xs uppercase tracking-widest text-ink">Save</button>
        </div>
      </div>
    </div>
  );
}

function F({ label, v, onChange, type = "text", className = "" }: { label: string; v: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type={type} value={v} onChange={(e) => onChange(e.target.value)} className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold" />
    </label>
  );
}

function Select({ label, v, onChange, options }: { label: string; v: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <select value={v} onChange={(e) => onChange(e.target.value)} className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold">
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </label>
  );
}

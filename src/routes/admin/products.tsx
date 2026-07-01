import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listProducts, upsertProduct, deleteProduct, listCategories, listBrands } from "@/lib/admin.functions";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Plus, Trash2, Pencil, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: Page });

const rupee = (n: number) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");

function Page() {
  const qc = useQueryClient();
  const list = useServerFn(listProducts);
  const cats = useServerFn(listCategories);
  const brs = useServerFn(listBrands);
  const upsert = useServerFn(upsertProduct);
  const del = useServerFn(deleteProduct);

  const products = useQuery({ queryKey: ["admin", "products"], queryFn: () => list() });
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: () => cats() });
  const brands = useQuery({ queryKey: ["admin", "brands"], queryFn: () => brs() });

  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (data: any) => upsert({ data }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows: any[] = products.data ?? [];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Your entire catalog — add, edit, archive, and manage stock."
        actions={
          <button
            onClick={() => setEditing({ status: "draft", stock: 0, mrp: 0, selling_price: 0, gst_percent: 18, low_stock_threshold: 5 })}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-ink"
          >
            <Plus className="size-3.5" /> New product
          </button>
        }
      />
      <Card>
        {products.isLoading ? (
          <p className="py-10 text-center text-sm text-black/40">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No products yet"
            hint="Click 'New product' to add your first item. The storefront will update the moment you publish."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                <tr className="border-b border-black/5 dark:border-white/5">
                  <th className="py-3">Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 dark:border-white/5">
                    <td className="py-3 font-medium">{r.name}</td>
                    <td className="font-mono text-xs">{r.sku || "—"}</td>
                    <td>{rupee(r.selling_price)}</td>
                    <td>{r.stock}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                        r.status === "archived" ? "bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50" :
                        "bg-amber-500/10 text-amber-600"
                      }`}>{r.status}</span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => setEditing(r)} className="mr-2 rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/10"><Pencil className="size-3.5" /></button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${r.name}"?`)) remove.mutate(r.id);
                        }}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-500/10"
                      ><Trash2 className="size-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#111]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl">{editing.id ? "Edit product" : "New product"}</h2>
              <button onClick={() => setEditing(null)}><X className="size-5" /></button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}
              className="grid gap-4 md:grid-cols-2"
            >
              <Field label="Name" required value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="SKU" value={editing.sku || ""} onChange={(v) => setEditing({ ...editing, sku: v })} />
              <Select label="Category" value={editing.category_id || ""} onChange={(v) => setEditing({ ...editing, category_id: v || null })}
                options={[{ value: "", label: "—" }, ...(categories.data ?? []).map((c: any) => ({ value: c.id, label: c.name }))]} />
              <Select label="Brand" value={editing.brand_id || ""} onChange={(v) => setEditing({ ...editing, brand_id: v || null })}
                options={[{ value: "", label: "—" }, ...(brands.data ?? []).map((c: any) => ({ value: c.id, label: c.name }))]} />
              <Field label="MRP (₹)" type="number" value={editing.mrp ?? 0} onChange={(v) => setEditing({ ...editing, mrp: Number(v) })} />
              <Field label="Selling Price (₹)" type="number" value={editing.selling_price ?? 0} onChange={(v) => setEditing({ ...editing, selling_price: Number(v) })} />
              <Field label="Stock" type="number" value={editing.stock ?? 0} onChange={(v) => setEditing({ ...editing, stock: Number(v) })} />
              <Field label="Low-stock alert at" type="number" value={editing.low_stock_threshold ?? 5} onChange={(v) => setEditing({ ...editing, low_stock_threshold: Number(v) })} />
              <Field label="Color" value={editing.color || ""} onChange={(v) => setEditing({ ...editing, color: v })} />
              <Field label="Material" value={editing.material || ""} onChange={(v) => setEditing({ ...editing, material: v })} />
              <Select label="Status" value={editing.status} onChange={(v) => setEditing({ ...editing, status: v })}
                options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "archived", label: "Archived" }]} />
              <Field label="Meta title" value={editing.meta_title || ""} onChange={(v) => setEditing({ ...editing, meta_title: v })} />
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-widest text-black/50 dark:text-cream/50">Description</label>
                <textarea
                  rows={4}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-gold dark:border-white/10 dark:bg-black/40"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditing(null)} className="rounded-full border px-4 py-2 text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={save.isPending} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2 text-xs uppercase tracking-widest text-ink disabled:opacity-50">
                  {save.isPending && <Loader2 className="size-3.5 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange, type = "text", required }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-black/50 dark:text-cream/50">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-gold dark:border-white/10 dark:bg-black/40"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-black/50 dark:text-cream/50">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-gold dark:border-white/10 dark:bg-black/40"
      >
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

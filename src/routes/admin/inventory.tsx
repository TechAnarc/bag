import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listProducts } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/inventory")({ component: () => (
  <AdminListPage
    title="Inventory"
    subtitle="Real-time stock across every product."
    fn={listProducts}
    queryKey="inventory"
    emptyTitle="No stock records"
    emptyHint="Add products to track their inventory here."
    columns={[
      { key: "name", label: "Product" },
      { key: "sku", label: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku || "—"}</span> },
      { key: "stock", label: "Stock" },
      { key: "low_stock_threshold", label: "Alert at" },
      { key: "status", label: "Status", render: (r) => {
        const s = r.stock ?? 0;
        if (s <= 0) return <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-600">Out of stock</span>;
        if (s <= (r.low_stock_threshold ?? 5)) return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">Low</span>;
        return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">In stock</span>;
      } },
    ]}
  />
) });

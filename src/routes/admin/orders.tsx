import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listOrders } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/orders")({ component: Page });

const rupee = (n: number) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");

function Page() {
  return (
    <AdminListPage
      title="Orders"
      subtitle="All customer orders across every fulfillment stage."
      fn={listOrders}
      queryKey="orders"
      emptyTitle="No orders yet"
      emptyHint="Once customers begin checking out, orders will populate here in real time."
      columns={[
        { key: "order_number", label: "Order", render: (r) => <span className="font-mono text-xs">{r.order_number}</span> },
        { key: "customer_name", label: "Customer" },
        { key: "status", label: "Status", render: (r) => <span className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-xs">{r.status}</span> },
        { key: "payment_status", label: "Payment" },
        { key: "total", label: "Total", className: "text-right", render: (r) => rupee(r.total) },
        { key: "created_at", label: "Placed", render: (r) => new Date(r.created_at).toLocaleString("en-IN") },
      ]}
    />
  );
}

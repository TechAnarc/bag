import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listPayments } from "@/lib/admin.functions";
export const Route = createFileRoute("/admin/payments")({ component: () => (
  <AdminListPage title="Payments" subtitle="Razorpay, UPI and COD ledger." fn={listPayments} queryKey="payments"
    emptyTitle="No payments recorded" emptyHint="Payment transactions will appear as orders are placed."
    columns={[
      { key: "method", label: "Method" },
      { key: "amount", label: "Amount", render: (r) => "₹" + Math.round(Number(r.amount || 0)).toLocaleString("en-IN") },
      { key: "status", label: "Status" },
      { key: "provider_ref", label: "Reference", render: (r) => <span className="font-mono text-xs">{r.provider_ref || "—"}</span> },
      { key: "created_at", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString("en-IN") },
    ]} />
) });

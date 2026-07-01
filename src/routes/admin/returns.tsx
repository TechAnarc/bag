import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listReturns } from "@/lib/admin.functions";
export const Route = createFileRoute("/admin/returns")({ component: () => (
  <AdminListPage title="Returns & Exchanges" subtitle="Manage customer returns." fn={listReturns} queryKey="returns"
    emptyTitle="No returns yet" emptyHint="Return requests from customers will appear here."
    columns={[
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" },
      { key: "refund_amount", label: "Refund" },
      { key: "created_at", label: "Requested", render: (r) => new Date(r.created_at).toLocaleDateString("en-IN") },
    ]} />
) });

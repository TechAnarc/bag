import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listCustomers } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/customers")({ component: () => (
  <AdminListPage
    title="Customers"
    subtitle="Everyone who has an account with your store."
    fn={listCustomers}
    queryKey="customers"
    emptyTitle="No customers yet"
    emptyHint="Customer profiles will appear here as people sign up."
    columns={[
      { key: "full_name", label: "Name", render: (r) => r.full_name || "—" },
      { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
      { key: "created_at", label: "Joined", render: (r) => new Date(r.created_at).toLocaleDateString("en-IN") },
    ]}
  />
) });

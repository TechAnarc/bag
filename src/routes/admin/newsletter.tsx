import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listSubscribers } from "@/lib/admin.functions";
export const Route = createFileRoute("/admin/newsletter")({ component: () => (
  <AdminListPage title="Newsletter" subtitle="Subscribers and campaigns." fn={listSubscribers} queryKey="subscribers"
    emptyTitle="No subscribers yet" emptyHint="Signups from your storefront newsletter form will land here."
    columns={[
      { key: "email", label: "Email" },
      { key: "name", label: "Name", render: (r) => r.name || "—" },
      { key: "is_subscribed", label: "Subscribed", render: (r) => r.is_subscribed ? "Yes" : "No" },
      { key: "created_at", label: "Joined", render: (r) => new Date(r.created_at).toLocaleDateString("en-IN") },
    ]} />
) });

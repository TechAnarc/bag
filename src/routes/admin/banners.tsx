import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listBanners } from "@/lib/admin.functions";
export const Route = createFileRoute("/admin/banners")({ component: () => (
  <AdminListPage title="Banners" subtitle="Storefront hero, category and promo banners." fn={listBanners} queryKey="banners"
    emptyTitle="No banners yet" emptyHint="Add a hero banner to spotlight new collections."
    columns={[
      { key: "title", label: "Title" },
      { key: "placement", label: "Placement" },
      { key: "priority", label: "Priority" },
      { key: "is_active", label: "Active", render: (r) => r.is_active ? "Yes" : "No" },
    ]} />
) });

import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listCategories } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/categories")({ component: () => (
  <AdminListPage
    title="Categories"
    subtitle="Organise your catalog with nested categories, images, and SEO."
    fn={listCategories}
    queryKey="categories"
    emptyTitle="No categories yet"
    emptyHint="Add categories to group products for shoppers to browse."
    columns={[
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug", render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
      { key: "sort_order", label: "Order" },
      { key: "is_featured", label: "Featured", render: (r) => r.is_featured ? "Yes" : "—" },
    ]}
  />
) });

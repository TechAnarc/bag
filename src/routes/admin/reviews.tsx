import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listReviews } from "@/lib/admin.functions";
export const Route = createFileRoute("/admin/reviews")({ component: () => (
  <AdminListPage title="Reviews" subtitle="Moderate customer reviews." fn={listReviews} queryKey="reviews"
    emptyTitle="No reviews yet" emptyHint="Approved product reviews will show up here."
    columns={[
      { key: "customer_name", label: "Customer" },
      { key: "rating", label: "Rating", render: (r) => "★".repeat(r.rating) },
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Date", render: (r) => new Date(r.created_at).toLocaleDateString("en-IN") },
    ]} />
) });

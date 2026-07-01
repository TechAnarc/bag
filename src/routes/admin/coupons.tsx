import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listCoupons } from "@/lib/admin.functions";
export const Route = createFileRoute("/admin/coupons")({ component: () => (
  <AdminListPage title="Coupons" subtitle="Discount codes, free shipping, and campaigns." fn={listCoupons} queryKey="coupons"
    emptyTitle="No coupons yet" emptyHint="Create your first promotional coupon."
    columns={[
      { key: "code", label: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
      { key: "discount_type", label: "Type" },
      { key: "discount_value", label: "Value" },
      { key: "usage_count", label: "Used" },
      { key: "is_active", label: "Active", render: (r) => r.is_active ? "Yes" : "No" },
    ]} />
) });

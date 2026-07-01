import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
export const Route = createFileRoute("/admin/shipping")({ component: () => (
  <><PageHeader title="Shipping" subtitle="Zones, rates, and carrier configuration." />
  <Card><EmptyState title="No shipping zones configured" hint="Configure zones and carriers in Settings → Shipping." /></Card></>
) });

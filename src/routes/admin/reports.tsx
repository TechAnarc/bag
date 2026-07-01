import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
export const Route = createFileRoute("/admin/reports")({ component: () => (
  <><PageHeader title="Reports" subtitle="Daily, weekly, monthly, quarterly and yearly reports." />
  <Card><EmptyState title="No reports generated" hint="Once you have orders, downloadable CSV/PDF reports will be available here." /></Card></>
) });

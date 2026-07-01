import { createFileRoute } from "@tanstack/react-router";
import { AdminListPage } from "@/components/admin-list-page";
import { listCampaigns } from "@/lib/admin.functions";
export const Route = createFileRoute("/admin/marketing")({ component: () => (
  <AdminListPage title="Marketing" subtitle="Email campaigns and automations." fn={listCampaigns} queryKey="campaigns"
    emptyTitle="No campaigns yet" emptyHint="Draft your first newsletter campaign."
    columns={[
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status" },
      { key: "opens", label: "Opens" },
      { key: "clicks", label: "Clicks" },
    ]} />
) });

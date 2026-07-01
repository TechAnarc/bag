import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/admin-shell";
export const Route = createFileRoute("/admin/settings")({ component: () => (
  <><PageHeader title="Settings" subtitle="Store identity, tax, shipping, payment and SEO." />
  <Card>
    <p className="text-sm text-black/60 dark:text-cream/60">Store settings live in the <code className="font-mono text-xs">settings</code> table and can be edited here. Full form UI ships in the next phase.</p>
  </Card></>
) });

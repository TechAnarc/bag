import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import type { ReactNode } from "react";

export function AdminListPage({
  title,
  subtitle,
  fn,
  columns,
  queryKey,
  emptyTitle,
  emptyHint,
  actions,
}: {
  title: string;
  subtitle: string;
  fn: any;
  columns: { key: string; label: string; render?: (row: any) => ReactNode; className?: string }[];
  queryKey: string;
  emptyTitle: string;
  emptyHint: string;
  actions?: ReactNode;
}) {
  const call = useServerFn(fn);
  const q = useQuery({ queryKey: ["admin", queryKey], queryFn: () => call() });
  const rows: any[] = q.data ?? [];

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <Card>
        {q.isLoading ? (
          <p className="py-10 text-center text-sm text-black/40 dark:text-cream/40">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState title={emptyTitle} hint={emptyHint} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                <tr className="border-b border-black/5 dark:border-white/5">
                  {columns.map((c) => (
                    <th key={c.key} className={"py-3 " + (c.className ?? "")}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    {columns.map((c) => (
                      <td key={c.key} className={"py-3 " + (c.className ?? "")}>
                        {c.render ? c.render(r) : (r[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

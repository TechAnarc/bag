import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({ component: ReportsPage });

type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "This week" },
  { key: "monthly", label: "This month" },
  { key: "quarterly", label: "This quarter" },
  { key: "yearly", label: "This year" },
];

const PAGE_SIZE = 100;
const MAX_PAGES = 30; // safety cap: 3,000 orders per report
const PREVIEW_ROWS = 50;
// Orders in these states are reported but excluded from sales figures.
const NON_REVENUE = new Set(["CANCELLED", "REFUNDED", "FAILED"]);

const rupee = (n: number) => "₹" + Math.round(Number(n || 0)).toLocaleString("en-IN");
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function periodStart(period: Period, now = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "daily":
      return today;
    case "weekly": {
      const sinceMonday = (today.getDay() + 6) % 7;
      today.setDate(today.getDate() - sinceMonday);
      return today;
    }
    case "monthly":
      return new Date(today.getFullYear(), today.getMonth(), 1);
    case "quarterly":
      return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    case "yearly":
      return new Date(today.getFullYear(), 0, 1);
  }
}

// Shape of an order as returned by GET /admin/orders (Prisma Decimals arrive as strings).
type ReportOrder = {
  id: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  subtotal?: number | string;
  total?: number | string;
  createdAt: string;
  user?: { name?: string | null; email?: string | null } | null;
  items?: { quantity?: number }[];
};

// The admin orders API is paged and sorted newest-first, so walk pages until we pass the period start.
async function fetchOrdersSince(
  start: Date,
): Promise<{ orders: ReportOrder[]; truncated: boolean }> {
  const orders: ReportOrder[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await adminApi.getOrders({ page, limit: PAGE_SIZE });
    const batch: ReportOrder[] = res.data?.orders || [];
    const totalPages: number = res.data?.pagination?.totalPages ?? 1;
    for (const o of batch) {
      if (new Date(o.createdAt) >= start) orders.push(o);
    }
    const last = batch[batch.length - 1];
    if (!last || new Date(last.createdAt) < start || page >= totalPages) {
      return { orders, truncated: false };
    }
  }
  return { orders, truncated: true };
}

function itemCount(o: ReportOrder): number {
  return (o.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0);
}

function bump(map: Map<string, { count: number; value: number }>, key: string, value: number) {
  const row = map.get(key) ?? { count: 0, value: 0 };
  row.count += 1;
  row.value += value;
  map.set(key, row);
}

// Quote every cell, and neutralise spreadsheet formula injection from user-entered text (e.g. names).
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(orders: ReportOrder[], period: Period) {
  const header = [
    "Order Number",
    "Date",
    "Customer",
    "Email",
    "Status",
    "Payment Status",
    "Payment Method",
    "Items",
    "Subtotal",
    "Total",
  ];
  const rows = orders.map((o) => [
    o.orderNumber || o.id,
    new Date(o.createdAt).toLocaleString("en-IN"),
    o.user?.name || "",
    o.user?.email || "",
    o.status || "",
    o.paymentStatus || "",
    o.paymentMethod || "",
    itemCount(o),
    Number(o.subtotal || 0).toFixed(2),
    Number(o.total || 0).toFixed(2),
  ]);
  const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `bbh-report-${period}-${isoDay(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const start = useMemo(() => periodStart(period), [period]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "reports", period, isoDay(start)],
    queryFn: () => fetchOrdersSince(start),
  });

  const orders = useMemo(() => data?.orders ?? [], [data]);

  const summary = useMemo(() => {
    let gross = 0;
    let saleOrders = 0;
    let items = 0;
    let lost = 0;
    const byStatus = new Map<string, { count: number; value: number }>();
    const byMethod = new Map<string, { count: number; value: number }>();
    for (const o of orders) {
      const total = Number(o.total || 0);
      bump(byStatus, o.status || "UNKNOWN", total);
      if (NON_REVENUE.has(o.status ?? "")) {
        lost += 1;
        continue;
      }
      gross += total;
      saleOrders += 1;
      items += itemCount(o);
      bump(byMethod, o.paymentMethod || "UNSPECIFIED", total);
    }
    const sorted = (m: Map<string, { count: number; value: number }>) =>
      [...m.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.value - a.value);
    return {
      gross,
      saleOrders,
      aov: saleOrders ? gross / saleOrders : 0,
      items,
      lost,
      byStatus: sorted(byStatus),
      byMethod: sorted(byMethod),
    };
  }, [orders]);

  const stats = [
    {
      label: "Gross Sales",
      value: rupee(summary.gross),
      hint: `${summary.saleOrders} billable orders`,
    },
    {
      label: "Orders",
      value: orders.length.toLocaleString("en-IN"),
      hint: "All statuses in period",
    },
    { label: "Avg Order Value", value: rupee(summary.aov), hint: "Billable orders only" },
    {
      label: "Items Sold",
      value: summary.items.toLocaleString("en-IN"),
      hint: `${summary.lost} cancelled / refunded / failed`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Daily, weekly, monthly, quarterly and yearly sales reports with CSV export."
        actions={
          <Button
            onClick={() => downloadCsv(orders, period)}
            disabled={isLoading || orders.length === 0}
          >
            <Download className="size-4" /> Download CSV
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={p.key === period ? "default" : "outline"}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-black/50 dark:text-cream/50">
          {fmtDate(start)} – {fmtDate(new Date())}
        </span>
      </div>

      {isLoading ? (
        <Card>
          <p className="py-12 text-center text-sm text-black/40 dark:text-cream/40">
            Building report…
          </p>
        </Card>
      ) : isError ? (
        <Card>
          <EmptyState
            title="Couldn't load report data"
            hint={
              (error as { response?: { data?: { message?: string } } } | null)?.response?.data
                ?.message ||
              (error as Error)?.message ||
              "The orders API did not respond."
            }
          />
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState
            title="No orders in this period"
            hint="Pick a longer period, or check back once orders come in."
          />
        </Card>
      ) : (
        <>
          {data?.truncated && (
            <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
              This period has more than {(PAGE_SIZE * MAX_PAGES).toLocaleString("en-IN")} orders;
              the report covers the most recent {orders.length.toLocaleString("en-IN")}.
            </p>
          )}

          <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  {s.label}
                </p>
                <p className="mt-2 font-serif text-2xl text-ink dark:text-cream">{s.value}</p>
                <p className="mt-1 text-xs text-black/50 dark:text-cream/50">{s.hint}</p>
              </Card>
            ))}
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Breakdown title="By Order Status" rows={summary.byStatus} />
            <Breakdown title="Sales by Payment Method" rows={summary.byMethod} />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl">Orders</h3>
              {orders.length > PREVIEW_ROWS && (
                <span className="text-xs text-black/50 dark:text-cream/50">
                  Showing latest {PREVIEW_ROWS} of {orders.length.toLocaleString("en-IN")} — the CSV
                  includes all
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-black/5 text-[11px] uppercase tracking-widest text-black/50 dark:border-white/5 dark:text-cream/50">
                    <TableHead className="py-3">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, PREVIEW_ROWS).map((o) => (
                    <TableRow key={o.id} className="border-b border-black/5 dark:border-white/5">
                      <TableCell className="py-3 font-mono text-xs font-semibold">
                        {o.orderNumber || o.id?.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {o.user?.name || o.user?.email || "Guest"}
                      </TableCell>
                      <TableCell className="text-xs">{o.status}</TableCell>
                      <TableCell className="text-xs">
                        {o.paymentMethod || "—"} · {o.paymentStatus || "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs">{itemCount(o)}</TableCell>
                      <TableCell className="text-right font-medium text-gold">
                        {rupee(Number(o.total || 0))}
                      </TableCell>
                      <TableCell className="text-right text-xs text-black/50 dark:text-cream/50">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; count: number; value: number }[];
}) {
  return (
    <Card>
      <h3 className="mb-4 font-serif text-xl">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-black/40 dark:text-cream/40">No data</p>
      ) : (
        <Table>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.key} className="border-b border-black/5 dark:border-white/5">
                <TableCell className="py-2.5 text-xs uppercase tracking-wider">
                  {r.key.replace(/_/g, " ")}
                </TableCell>
                <TableCell className="text-right text-xs text-black/60 dark:text-cream/60">
                  {r.count} orders
                </TableCell>
                <TableCell className="text-right font-medium">{rupee(r.value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

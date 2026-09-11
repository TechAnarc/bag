import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  IndianRupee, ShoppingBag, Users, Package, TrendingUp, AlertTriangle,
  PackageX, CheckCircle2, XCircle, Clock, Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function Kpi({
  label, value, icon: Icon, tone = "default", isLoading = false,
}: { label: string; value: string | number; icon: any; tone?: "default" | "gold" | "warn" | "danger" | "good"; isLoading?: boolean }) {
  const toneMap: Record<string, string> = {
    default: "text-black/70 dark:text-cream/70",
    gold: "text-gold",
    warn: "text-amber-500",
    danger: "text-red-500",
    good: "text-emerald-500",
  };
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">{label}</p>
        <Icon className={`size-4 ${toneMap[tone]}`} />
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-24 rounded" />
      ) : (
        <p className="mt-3 font-serif text-2xl tracking-tight md:text-3xl">{value}</p>
      )}
    </Card>
  );
}

function Dashboard() {
  // Independent parallel queries with staleTime so navigation is fast and independent
  const s = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => (await adminApi.getDashboardStats()).data,
    staleTime: 30000,
  });
  const chart = useQuery({
    queryKey: ["admin", "chart"],
    queryFn: async () => (await adminApi.getChartData(14)).data,
    staleTime: 60000,
  });
  const o = useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: async () => {
      const result = await adminApi.getOrders({ limit: 10 });
      return result.data?.orders ?? result.orders ?? [];
    },
    staleTime: 15000,
  });

  const d = s.data;
  const c = chart.data;
  const ordersList = o.data ?? [];

  return (
    <>
      <PageHeader
        title="Dashboard Studio"
        subtitle="Real-time performance analytics for Bombay Bag House."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
        <Kpi label="Total Revenue" value={rupee(d?.totalRevenue ?? 0)} icon={IndianRupee} tone="gold" isLoading={s.isLoading} />
        <Kpi label="Total Orders" value={d?.totalOrders ?? 0} icon={ShoppingBag} isLoading={s.isLoading} />
        <Kpi label="Recent Revenue" value={rupee(d?.recentRevenue ?? 0)} icon={TrendingUp} tone="gold" isLoading={s.isLoading} />
        <Kpi label="Total Users" value={d?.totalUsers ?? 0} icon={Users} isLoading={s.isLoading} />

        <Kpi label="Pending Orders" value={d?.pendingOrders ?? 0} icon={Clock} tone="warn" isLoading={s.isLoading} />
        <Kpi label="Total Products" value={d?.totalProducts ?? 0} icon={Package} isLoading={s.isLoading} />
        <Kpi label="Out of Stock" value={d?.outOfStockProducts ?? 0} icon={PackageX} tone="danger" isLoading={s.isLoading} />
        <Kpi label="Recent Users" value={d?.recentUsers ?? 0} icon={Users} isLoading={s.isLoading} />

        <Kpi label="UPIS · High Value" value={d?.upisStats?.highValue ?? 0} icon={Star} tone="gold" isLoading={s.isLoading} />
        <Kpi label="UPIS · At Risk" value={d?.upisStats?.atRisk ?? 0} icon={AlertTriangle} tone="warn" isLoading={s.isLoading} />
        <Kpi label="UPIS · Loyal" value={d?.upisStats?.loyal ?? 0} icon={CheckCircle2} tone="good" isLoading={s.isLoading} />
        <Kpi label="Churn Alerts" value={d?.upisStats?.churnAlerts ?? 0} icon={XCircle} tone="danger" isLoading={s.isLoading} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl">Revenue Trend · Last 14 days</h3>
              <p className="text-xs text-black/50 dark:text-cream/50">Bombay Bag House sales analytics</p>
            </div>
          </div>
          <div className="h-72">
            {chart.isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-60 w-full rounded-md" />
              </div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={c?.revenueChart ?? []}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a961" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#c9a961" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }}
                    formatter={(v: number, k: string) => (k === "revenue" ? rupee(Number(v)) : v)}
                    labelFormatter={(v) => new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl">UPIS Customer Intelligence</h3>
          <p className="text-xs text-black/50 dark:text-cream/50">Predictive Intelligence & Segments</p>
          <div className="mt-5 space-y-3">
            {s.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              [
                ["High Value", d?.upisStats?.highValue ?? 0, "bg-[#c9a961]"],
                ["Loyal", d?.upisStats?.loyal ?? 0, "bg-emerald-500"],
                ["At Risk", d?.upisStats?.atRisk ?? 0, "bg-red-500"],
              ].map(([label, v, color]) => {
                const total = (d?.totalUsers ?? 0) || 1;
                const pct = Math.round((Number(v) / total) * 100);
                return (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs">
                      <span>{label}</span>
                      <span className="text-black/50 dark:text-cream/50">{v} · {pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-xl">Recent Orders</h3>
          </div>
          {o.isLoading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : ordersList.length === 0 ? (
            <EmptyState title="No orders yet" description="When customers place orders, they'll appear here in real time." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <th className="py-3">Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map((r: any) => (
                    <tr key={r.id} className="border-b border-black/5 dark:border-white/5">
                      <td className="py-3 font-mono text-xs">{r.orderNumber || r.id?.slice(0, 8)}</td>
                      <td>{r.user?.name || r.customerName || 'Guest'}</td>
                      <td><span className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">{r.status}</span></td>
                      <td className="text-xs">{r.paymentStatus}</td>
                      <td className="text-xs text-black/50 dark:text-cream/50">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="text-right font-medium">{rupee(Number(r.total || r.totalAmount || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

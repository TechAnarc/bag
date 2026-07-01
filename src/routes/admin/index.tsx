import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, listRecentOrders } from "@/lib/admin.functions";
import { Card, PageHeader, EmptyState } from "@/components/admin-shell";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  IndianRupee, ShoppingBag, Users, Package, TrendingUp, AlertTriangle,
  Ticket, Mail, Star, PackageX, CheckCircle2, XCircle, Clock,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function Kpi({
  label, value, icon: Icon, tone = "default",
}: { label: string; value: string | number; icon: any; tone?: "default" | "gold" | "warn" | "danger" | "good" }) {
  const toneMap = {
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
      <p className="mt-3 font-serif text-2xl tracking-tight md:text-3xl">{value}</p>
    </Card>
  );
}

function Dashboard() {
  const stats = useServerFn(getDashboardStats);
  const orders = useServerFn(listRecentOrders);
  const s = useQuery({ queryKey: ["admin", "stats"], queryFn: () => stats() });
  const o = useQuery({ queryKey: ["admin", "recent-orders"], queryFn: () => orders() });

  const d = s.data;
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A real-time view of everything happening in your store."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
        <Kpi label="Revenue · Today" value={rupee(d?.revenueToday ?? 0)} icon={IndianRupee} tone="gold" />
        <Kpi label="Orders · Today" value={d?.ordersToday ?? 0} icon={ShoppingBag} />
        <Kpi label="Revenue · Month" value={rupee(d?.revenueMonth ?? 0)} icon={TrendingUp} tone="gold" />
        <Kpi label="Orders · Month" value={d?.ordersMonth ?? 0} icon={ShoppingBag} />
        <Kpi label="Pending Orders" value={d?.pending ?? 0} icon={Clock} tone="warn" />
        <Kpi label="Delivered" value={d?.delivered ?? 0} icon={CheckCircle2} tone="good" />
        <Kpi label="Cancelled" value={d?.cancelled ?? 0} icon={XCircle} tone="danger" />
        <Kpi label="Average Order Value" value={rupee(d?.avgOrderValue ?? 0)} icon={IndianRupee} />
        <Kpi label="Customers" value={d?.customers ?? 0} icon={Users} />
        <Kpi label="Products" value={d?.products ?? 0} icon={Package} />
        <Kpi label="Out of Stock" value={d?.outOfStock ?? 0} icon={PackageX} tone="danger" />
        <Kpi label="Low Stock" value={d?.lowStock ?? 0} icon={AlertTriangle} tone="warn" />
        <Kpi label="Coupons Active" value={d?.couponsActive ?? 0} icon={Ticket} />
        <Kpi label="Subscribers" value={d?.subscribers ?? 0} icon={Mail} />
        <Kpi label="Reviews" value={d?.reviews ?? 0} icon={Star} />
        <Kpi label="Lifetime Revenue" value={rupee(d?.revenueAll ?? 0)} icon={IndianRupee} tone="gold" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl">Sales · Last 14 days</h3>
              <p className="text-xs text-black/50 dark:text-cream/50">Revenue and order volume</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={d?.series ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a961" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#c9a961" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 12 }}
                  formatter={(v: any, k: string) => (k === "revenue" ? rupee(Number(v)) : v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl">Order status</h3>
          <p className="text-xs text-black/50 dark:text-cream/50">Live snapshot</p>
          <div className="mt-5 space-y-3">
            {[
              ["Pending", d?.pending ?? 0, "bg-amber-500"],
              ["Delivered", d?.delivered ?? 0, "bg-emerald-500"],
              ["Cancelled", d?.cancelled ?? 0, "bg-red-500"],
            ].map(([label, v, color]) => {
              const total = (d?.ordersAll ?? 0) || 1;
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
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-xl">Recent orders</h3>
          </div>
          {o.isLoading ? (
            <p className="py-8 text-center text-sm text-black/40">Loading…</p>
          ) : (o.data ?? []).length === 0 ? (
            <EmptyState title="No orders yet" hint="When customers place orders, they'll appear here in real time." />
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
                  {(o.data ?? []).map((r: any) => (
                    <tr key={r.id} className="border-b border-black/5 dark:border-white/5">
                      <td className="py-3 font-mono text-xs">{r.order_number}</td>
                      <td>{r.customer_name}</td>
                      <td><span className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">{r.status}</span></td>
                      <td className="text-xs">{r.payment_status}</td>
                      <td className="text-xs text-black/50 dark:text-cream/50">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="text-right font-medium">{rupee(Number(r.total))}</td>
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

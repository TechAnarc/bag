import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/services/adminApi";
import { Card, PageHeader } from "@/components/admin-shell";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { TrendingUp, ShoppingBag, IndianRupee, Users, ShieldCheck, Activity } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: AnalyticsPage });

const rupee = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");

function AnalyticsPage() {
  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ["admin", "chart-data", 14],
    queryFn: async () => {
      const res = await adminApi.getChartData(14);
      return res.data || {};
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await adminApi.getDashboardStats();
      return res.data || {};
    },
  });

  const { data: velocityData } = useQuery({
    queryKey: ["admin", "surveillance-velocity"],
    queryFn: async () => {
      const res = await adminApi.getSurveillanceMetrics();
      return res.data || {};
    },
  });

  const revenueChart = chartData?.revenueChart || [];
  const ordersChart = chartData?.ordersChart || [];

  return (
    <>
      <PageHeader
        title="Analytics & Telemetry"
        subtitle="Deep metrics into revenue velocity, conversion bands, and catalog demand."
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Gross Revenue</p>
            <IndianRupee className="size-4 text-gold" />
          </div>
          <p className="mt-2 font-serif text-3xl text-gold">{rupee(statsData?.totalRevenue || 0)}</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">All-time processed order volume</p>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Order Volume</p>
            <ShoppingBag className="size-4 text-blue-500" />
          </div>
          <p className="mt-2 font-serif text-3xl text-ink dark:text-cream">{statsData?.totalOrders || 0}</p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Total checkout fulfillments</p>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Node Stability</p>
            <Activity className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-serif text-3xl text-emerald-600">
            {velocityData?.stability ? `${(velocityData.stability * 100).toFixed(0)}%` : "99%"}
          </p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Payment gateway health score</p>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-black/50 dark:text-cream/50">Order Velocity</p>
            <TrendingUp className="size-4 text-purple-500" />
          </div>
          <p className="mt-2 font-serif text-3xl text-ink dark:text-cream">
            {velocityData?.velocity || "0.00"} <span className="text-xs font-sans text-black/40 dark:text-cream/40">/min</span>
          </p>
          <p className="mt-1 text-xs text-black/50 dark:text-cream/50">Real-time checkout stream rate</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-serif text-xl">Revenue Velocity · 14 Days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: any) => [rupee(Number(v)), "Revenue"]}
                  labelFormatter={(v: any) => new Date(v).toLocaleDateString("en-IN")}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-xl">Orders Dispatched · 14 Days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: any) => [Number(v), "Orders"]}
                  labelFormatter={(v: any) => new Date(v).toLocaleDateString("en-IN")}
                />
                <Bar dataKey="orders" fill="#0A0A0A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}

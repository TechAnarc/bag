import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/admin.functions";
import { Card, PageHeader } from "@/components/admin-shell";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
export const Route = createFileRoute("/admin/analytics")({ component: Page });
const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
function Page() {
  const fn = useServerFn(getDashboardStats);
  const q = useQuery({ queryKey: ["admin", "analytics"], queryFn: () => fn() });
  const d = q.data;
  return (
    <>
      <PageHeader title="Analytics" subtitle="Deep insight into revenue, orders, and customers." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-serif text-xl">Revenue · 14 days</h3>
          <div className="h-64"><ResponsiveContainer><AreaChart data={d?.series ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: any) => rupee(Number(v))} />
            <Area type="monotone" dataKey="revenue" stroke="#c9a961" fill="#c9a96122" />
          </AreaChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <h3 className="mb-4 font-serif text-xl">Orders · 14 days</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={d?.series ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="orders" fill="#111" />
          </BarChart></ResponsiveContainer></div>
        </Card>
      </div>
    </>
  );
}

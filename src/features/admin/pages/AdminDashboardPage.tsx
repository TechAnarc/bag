import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../services/adminApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ShoppingCart, Gem, DollarSign, Clock, PackageX, Mail, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Line,
	LineChart,
	Area,
	AreaChart,
	Pie,
	PieChart,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#6366F1", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE"];

export default function AdminDashboardPage() {
	const navigate = useNavigate();

	const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
		queryKey: ["admin-recent-inquiries"],
		queryFn: async () => {
			const response = await adminApi.getInquiries({ limit: 3 });
			return response.data;
		},
	});
	const { data: statsData, isLoading: statsLoading } = useQuery({
		queryKey: ["admin-dashboard-stats"],
		queryFn: async () => {
			const response = await adminApi.getDashboardStats();
			return response.data;
		},
	});

	const { data: chartData, isLoading: chartsLoading } = useQuery({
		queryKey: ["admin-chart-data"],
		queryFn: async () => {
			const response = await adminApi.getChartData(30);
			return response.data;
		},
	});

	const statCards = [
		{
			title: "Total Users",
			value: statsData?.totalUsers || 0,
			icon: <Users className="w-6 h-6 text-indigo-400" />,
			change: `+${statsData?.recentUsers || 0} this week`,
			gradient: "from-indigo-600 to-indigo-500",
		},
		{
			title: "Total Orders",
			value: statsData?.totalOrders || 0,
			icon: <ShoppingCart className="w-6 h-6 text-purple-400" />,
			change: `${statsData?.pendingOrders || 0} pending`,
			gradient: "from-purple-600 to-purple-500",
		},
		{
			title: "Total Products",
			value: statsData?.totalProducts || 0,
			icon: <Gem className="w-6 h-6 text-pink-400" />,
			change: `${statsData?.outOfStockProducts || 0} out of stock`,
			gradient: "from-pink-600 to-pink-500",
		},
		{
			title: "Total Revenue",
			value: `₹${((statsData?.totalRevenue || 0) / 1000).toFixed(1)}k`,
			icon: <DollarSign className="w-6 h-6 text-amber-400" />,
			change: `+₹${((statsData?.recentRevenue || 0) / 1000).toFixed(1)}k this week`,
			gradient: "from-amber-600 to-amber-500",
		},
		{
			title: "Pending Orders",
			value: statsData?.pendingOrders || 0,
			icon: <Clock className="w-6 h-6 text-cyan-400" />,
			change: "Requires attention",
			gradient: "from-cyan-600 to-cyan-500",
		},
		{
			title: "Out of Stock",
			value: statsData?.outOfStockProducts || 0,
			icon: <PackageX className="w-6 h-6 text-red-400" />,
			change: "Needs restocking",
			gradient: "from-red-600 to-red-500",
		},
	];
    
    // Quick map for navigation
    const getCardLink = (title: string) => {
        switch(title) {
            case "Total Users": return "/admin/users";
            case "Total Orders": return "/admin/orders";
            case "Total Products": return "/admin/inventory";
            case "Total Revenue": return "/admin/orders";
            case "Pending Orders": return "/admin/orders"; // Pre-filtering would be cool but keep simple
            case "Out of Stock": return "/admin/inventory";
            default: return "/admin/dashboard";
        }
    };

	return (
		<div className="space-y-8">
			{/* Welcome Header */}
			<div>
				<h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
				<p className="text-slate-400">
					Welcome back! Here's what's happening with your business today.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{statsLoading ? (
					Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
							<CardHeader className="pb-3">
								<Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800 mb-2" />
								<Skeleton className="h-3 w-40 bg-slate-200 dark:bg-slate-800" />
							</CardContent>
						</Card>
					))
				) : (
					statCards.map((stat, index) => (
						<Card
							key={index}
							onClick={() => navigate(getCardLink(stat.title))}
							className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg cursor-pointer"
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
										{stat.title}
									</CardTitle>
									<div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-lg shadow-lg text-white`}>
										{stat.icon}
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-slate-900 dark:text-white mb-1 font-numeric">{stat.value}</div>
								<p className="text-xs text-slate-500 font-numeric">{stat.change}</p>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Charts Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Orders Chart */}
				<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<CardHeader>
						<CardTitle className="text-lg text-slate-900 dark:text-white">Orders Trend</CardTitle>
						<p className="text-sm text-slate-500">Daily orders over the last 30 days</p>
					</CardHeader>
					<CardContent>
						{chartsLoading ? (
							<Skeleton className="h-64 w-full bg-slate-200 dark:bg-slate-800" />
						) : (
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={chartData?.ordersChart || []}>
									<CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.3} />
									<XAxis
										dataKey="date"
										stroke="#64748B"
										tick={{ fill: "#64748B" }}
										tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
									/>
									<YAxis stroke="#64748B" tick={{ fill: "#64748B" }} />
									<Tooltip
										contentStyle={{
											backgroundColor: "rgba(30, 41, 59, 0.9)", // slightly transparent dark
											border: "1px solid #334155",
											borderRadius: "8px",
											color: "#fff"
										}}
										labelStyle={{ color: "#94A3B8" }}
									/>
									<Legend wrapperStyle={{ color: "#64748B" }} />
									<Line
										type="monotone"
										dataKey="orders"
										stroke="#6366F1"
										strokeWidth={3}
										dot={{ fill: "#6366F1", r: 4 }}
										activeDot={{ r: 6 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>

				{/* Revenue Chart */}
				<Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
					<CardHeader>
						<CardTitle className="text-lg text-slate-900 dark:text-white">Revenue Trend</CardTitle>
						<p className="text-sm text-slate-500">Daily revenue over the last 30 days</p>
					</CardHeader>
					<CardContent>
						{chartsLoading ? (
							<Skeleton className="h-64 w-full bg-slate-200 dark:bg-slate-800" />
						) : (
							<ResponsiveContainer width="100%" height={300}>
								<AreaChart data={chartData?.revenueChart || []}>
									<defs>
										<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
											<stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.3} />
									<XAxis
										dataKey="date"
										stroke="#64748B"
										tick={{ fill: "#64748B" }}
										tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
									/>
									<YAxis stroke="#64748B" tick={{ fill: "#64748B" }} />
									<Tooltip
										contentStyle={{
											backgroundColor: "rgba(30, 41, 59, 0.9)",
											border: "1px solid #334155",
											borderRadius: "8px",
											color: "#fff"
										}}
										labelStyle={{ color: "#94A3B8" }}
										formatter={(value: any) => [`₹${value}`, "Revenue"]}
									/>
									<Legend wrapperStyle={{ color: "#64748B" }} />
									<Area
										type="monotone"
										dataKey="revenue"
										stroke="#8B5CF6"
										strokeWidth={3}
										fill="url(#revenueGradient)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>
			</div>

            {/* 🧠 UPIS Intelligence Feed */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        Predictive Intelligence
                        <Badge className="bg-amber-500 text-[10px] uppercase">Alpha_v1</Badge>
                    </h2>
                    <Button 
						variant="ghost" 
						className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
						onClick={() => navigate("/admin/users")}
					>
						Registry Command Center →
					</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900 border-indigo-500/20 text-white p-6 relative overflow-hidden group">
                        <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:rotate-12 transition-transform">
                            <BrainCircuit size={100} />
                        </div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-4">LIFECYCLE_DISTRIBUTION</p>
                        <div className="space-y-4">
                            {[
                                { label: 'High Value', count: statsData?.upisStats?.highValue || 0, color: 'bg-amber-500' },
                                { label: 'At Risk', count: statsData?.upisStats?.atRisk || 0, color: 'bg-rose-500' },
                                { label: 'Loyal', count: statsData?.upisStats?.loyal || 0, color: 'bg-emerald-500' },
                            ].map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span>{item.label}</span>
                                        <span className="font-numeric">{item.count}</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className={cn("h-full", item.color)} style={{ width: `${Math.min(100, (item.count / (statsData?.totalUsers || 1)) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">CONVERSION_VELOCITY</p>
                        <div className="flex flex-col items-center justify-center h-full pb-6">
                           <div className="text-5xl font-black italic text-indigo-600 font-numeric">
                              {((statsData?.upisStats?.avgConversion || 0) * 100).toFixed(1)}%
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Aggregate_Confidence: 85%</p>
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">ACTIVE_THREAT_MONITOR</p>
                        <div className="space-y-3">
                           <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-rose-500">Churn_Alerts</span>
                              <Badge className="bg-rose-500 text-white font-numeric-mono">{statsData?.upisStats?.churnAlerts || 0}</Badge>
                           </div>
                           <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-amber-500">Fraud_Signals</span>
                              <Badge className="bg-amber-500 text-white font-numeric-mono">{statsData?.upisStats?.fraudSignals || 0}</Badge>
                           </div>
                           <p className="text-[9px] text-slate-400 italic">Predictive primitives updated 3m ago.</p>
                        </div>
                    </Card>
                </div>
            </div>

			{/* Recent Inquiries Section */}
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
						Recent Inquiries
						<Badge className="bg-indigo-600 text-[10px] uppercase">{inquiriesData?.filter((i: any) => !i.isRead).length || 0} New</Badge>
					</h2>
					<Button 
						variant="ghost" 
						className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-400/10"
						onClick={() => navigate("/admin/inquiries")}
					>
						View All Inquiries
					</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{inquiriesLoading ? (
						Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-48 w-full bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl" />
						))
					) : inquiriesData?.length === 0 ? (
						<div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
							<p className="text-slate-500 italic">No recent inquiries to display.</p>
						</div>
					) : (
						inquiriesData?.slice(0, 3).map((inquiry: any) => (
							<Card 
								key={inquiry.id} 
								className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 relative overflow-hidden flex flex-col ${!inquiry.isRead ? 'ring-1 ring-indigo-500/20' : ''}`}
							>
								{!inquiry.isRead && (
									<div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
										<div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500 rotate-45 translate-x-8 -translate-y-8" />
									</div>
								)}
								<CardHeader className="pb-2">
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
												{inquiry.name.charAt(0)}
											</div>
											<div>
												<CardTitle className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
													{inquiry.name}
												</CardTitle>
												<CardDescription className="text-[10px] flex items-center gap-1 text-slate-500">
													<Clock size={10} /> {new Date(inquiry.createdAt).toLocaleDateString()}
												</CardDescription>
											</div>
										</div>
										<Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
											{inquiry.subject || "Inquiry"}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="flex-1 pb-4">
									<p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 italic leading-relaxed">
										"{inquiry.message}"
									</p>
								</CardContent>
								<div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
									<span className="text-[10px] text-slate-500 truncate max-w-[140px]">{inquiry.email}</span>
									<Button 
										size="sm" 
										variant="ghost" 
										className="h-7 text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 p-0"
										onClick={() => navigate("/admin/inquiries")}
									>
										View Details →
									</Button>
								</div>
							</Card>
						))
					)}
				</div>
			</div>
		</div>
	);
}

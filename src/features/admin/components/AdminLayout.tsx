import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	Users,
	Gem,
	Truck,
	Settings,
	User,
	LogOut,
	Menu,
	X,
	ChevronLeft,
	Layers,
	Star,
	Mail,
	Bell,
	Activity,
	ShieldCheck,
	Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi } from "../services/adminApi";
import { useQuery } from "@tanstack/react-query";

interface NavItem {
	label: string;
	icon: React.ReactNode;
	path: string;
}

const navItems: NavItem[] = [
	{ label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/admin/dashboard" },
	{ label: "Inquiries", icon: <Mail className="w-5 h-5" />, path: "/admin/inquiries" },
	{ label: "Inventory", icon: <Package className="w-5 h-5" />, path: "/admin/inventory" },
	{ label: "Orders", icon: <ShoppingCart className="w-5 h-5" />, path: "/admin/orders" },
	{ label: "Users", icon: <Users className="w-5 h-5" />, path: "/admin/users" },
	{ label: "Products", icon: <Gem className="w-5 h-5" />, path: "/admin/products" },
	{ label: "Categories", icon: <Layers className="w-5 h-5" />, path: "/admin/categories" },
	{ label: "Reviews", icon: <Star className="w-5 h-5" />, path: "/admin/reviews" },
	{ label: "Shipment", icon: <Truck className="w-5 h-5" />, path: "/admin/shipment" },
	{ label: "Decision Stream", icon: <Activity className="w-5 h-5" />, path: "/admin/autonomy/decisions" },
	{ label: "Policy Console", icon: <ShieldCheck className="w-5 h-5" />, path: "/admin/autonomy/policies" },
	{ label: "Settings", icon: <Settings className="w-5 h-5" />, path: "/admin/settings" },
	{ label: "Profile", icon: <User className="w-5 h-5" />, path: "/admin/profile" },
];

export default function AdminLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [theme, setTheme] = useState<'light' | 'dark'>('light');
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [theme]);

	const toggleTheme = () => {
		setTheme(prev => prev === 'dark' ? 'light' : 'dark');
	};

	const { data: profileData } = useQuery({
		queryKey: ["admin-profile"],
		queryFn: async () => {
			const response = await adminApi.getProfile();
			return response.data;
		},
	});

	const { data: inquiriesData } = useQuery({
		queryKey: ["admin-inquiries-unread"],
		queryFn: async () => {
			const response = await adminApi.getInquiries({ isRead: false });
			return response.data;
		},
	});

	const unreadCount = inquiriesData?.length || 0;

	const handleLogout = () => {
		adminApi.logout();
		navigate("/admin/login");
	};

	const handleNavigation = (path: string) => {
		navigate(path);
		setMobileMenuOpen(false);
	};

	return (
		<div className={cn("min-h-screen transition-colors duration-300 font-sans", theme === 'dark' ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900")}>
			{/* Sidebar - Desktop */}
			<aside
				className={cn(
					"fixed left-0 top-0 h-full border-r transition-all duration-300 z-30 hidden lg:flex flex-col",
					theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm",
					sidebarOpen ? "w-64" : "w-20",
				)}
			>
				{/* Header */}
				<div className={cn("p-4 border-b flex items-center justify-between", theme === 'dark' ? "border-slate-800" : "border-slate-200")}>
					{sidebarOpen && (
						<div className="flex items-center gap-2">
							<img src="/assets/triveni-brand-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
							<h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
								Triveni Admin
							</h1>
						</div>
					)}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className={cn(theme === 'dark' ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
					>
						{sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
					</Button>
				</div>

				{/* Navigation - Scrollable */}
				<nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
					{navItems.map((item) => {
						const isActive = location.pathname === item.path;
						return (
							<Button
								key={item.path}
								variant="ghost"
								onClick={() => handleNavigation(item.path)}
								className={cn(
									"w-full justify-start gap-3 transition-all",
									isActive
										? (theme === 'dark' ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500" : "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500")
										: (theme === 'dark' ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"),
									!sidebarOpen && "justify-center",
								)}
							>
								{item.icon}
								{sidebarOpen && <span>{item.label}</span>}
							</Button>
						);
					})}
				</nav>

				{/* Footer - User Info - Fixed at bottom of sidebar but within the flex container */}
				<div className={cn("mt-auto p-4 border-t", theme === 'dark' ? "border-slate-800" : "border-slate-200")}>
					{sidebarOpen ? (
						<div className="flex items-center gap-3">
							<Avatar className="h-10 w-10 ring-2 ring-indigo-500">
								<AvatarImage src={profileData?.avatar || undefined} />
								<AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600">
									{profileData?.name?.charAt(0) || "A"}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{profileData?.name || "Admin"}</p>
								<p className="text-xs text-slate-500 truncate">{profileData?.role || "ADMIN"}</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleLogout}
								className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
							>
								<LogOut className="w-4 h-4" />
							</Button>
						</div>
					) : (
						<Button
							variant="ghost"
							size="icon"
							onClick={handleLogout}
							className="w-full text-slate-400 hover:text-red-400 hover:bg-slate-800"
						>
							<LogOut className="w-5 h-5" />
						</Button>
					)}
				</div>
			</aside>

			{/* Mobile Sidebar */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
					<aside className={cn("fixed left-0 top-0 h-full w-64 border-r z-50 flex flex-col", theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
						{/* Header */}
						<div className={cn("p-4 border-b flex items-center justify-between", theme === 'dark' ? "border-slate-800" : "border-slate-200")}>
							<h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
								Admin Panel
							</h1>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setMobileMenuOpen(false)}
								className="text-slate-400 hover:text-white hover:bg-slate-800"
							>
								<X className="w-5 h-5" />
							</Button>
						</div>

						{/* Navigation - Scrollable */}
						<nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
							{navItems.map((item) => {
								const isActive = location.pathname === item.path;
								return (
									<Button
										key={item.path}
										variant="ghost"
										onClick={() => handleNavigation(item.path)}
										className={cn(
											"w-full justify-start gap-3",
											isActive
												? (theme === 'dark' ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500" : "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-500")
												: (theme === 'dark' ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"),
										)}
									>
										{item.icon}
										<span>{item.label}</span>
									</Button>
								);
							})}
						</nav>

						{/* User Info - Bottom */}
						<div className={cn("mt-auto p-4 border-t", theme === 'dark' ? "border-slate-800" : "border-slate-200")}>
							<div className="flex items-center gap-3 mb-4">
								<Avatar className="h-10 w-10 ring-2 ring-indigo-500">
									<AvatarImage src={profileData?.avatar || undefined} />
									<AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600">
										{profileData?.name?.charAt(0) || "A"}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{profileData?.name || "Admin"}</p>
									<p className="text-xs text-slate-500 truncate">{profileData?.role || "ADMIN"}</p>
								</div>
							</div>
							<Button
								variant="outline"
								onClick={handleLogout}
								className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
							>
								<LogOut className="w-4 h-4 mr-2" />
								Logout
							</Button>
						</div>
					</aside>
				</div>
			)}

			{/* Main Content */}
			<main
				className={cn(
					"transition-all duration-300 min-h-screen",
					sidebarOpen ? "lg:ml-64" : "lg:ml-20",
				)}
			>
				{/* Top Bar */}
				<header className={cn("sticky top-0 z-20 backdrop-blur-lg border-b px-4 lg:px-8 py-4", theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200")}>
					<div className="flex items-center justify-between">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileMenuOpen(true)}
							className="lg:hidden text-slate-400"
						>
							<Menu className="w-6 h-6" />
						</Button>

						<div className="flex-1 lg:flex-none">
							<h2 className={cn("text-lg lg:text-xl font-semibold", theme === 'dark' ? "text-white" : "text-slate-900")}>
								{navItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}
							</h2>
						</div>

						{/* Desktop User Menu */}
						<div className="hidden lg:flex items-center gap-4">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className={cn("relative", theme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")}
									>
										<Bell className="w-5 h-5" />
										{unreadCount > 0 && (
											<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
												{unreadCount}
											</span>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800 text-white">
									<DropdownMenuLabel className="flex items-center justify-between">
										<span>Notifications</span>
										{unreadCount > 0 && <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded-full">{unreadCount} New</span>}
									</DropdownMenuLabel>
									<DropdownMenuSeparator className="bg-slate-800" />
									{inquiriesData && inquiriesData.length > 0 ? (
										inquiriesData.slice(0, 4).map((inquiry: any) => (
											<DropdownMenuItem
												key={inquiry.id}
												className="flex flex-col items-start gap-1 p-3 focus:bg-slate-800 cursor-pointer"
												onClick={() => navigate("/admin/inquiries")}
											>
												<div className="flex items-center justify-between w-full">
													<span className="font-semibold text-sm text-indigo-400">{inquiry.name}</span>
													<span className="text-[10px] text-slate-500">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
												</div>
												<p className="text-xs text-slate-300 line-clamp-1 w-full">{inquiry.subject || "New Inquiry"}</p>
												<p className="text-[10px] text-slate-500 line-clamp-1 w-full">{inquiry.message}</p>
											</DropdownMenuItem>
										))
									) : (
										<div className="p-4 text-center text-sm text-slate-500">
											No new notifications
										</div>
									)}
									<DropdownMenuSeparator className="bg-slate-800" />
									<DropdownMenuItem className="p-2 text-center text-indigo-400 focus:bg-slate-800 justify-center cursor-pointer" onClick={() => navigate("/admin/inquiries")}>
										View All Notifications
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<Button variant="ghost" size="icon" onClick={toggleTheme} className={cn(theme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")}>
								{theme === 'dark' ? "🌞" : "🌙"}
							</Button>
							<Avatar className="h-9 w-9 ring-2 ring-indigo-500 cursor-pointer" onClick={() => navigate("/admin/profile")}>
								<AvatarImage src={profileData?.avatar || undefined} />
								<AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-sm">
									{profileData?.name?.charAt(0) || "A"}
								</AvatarFallback>
							</Avatar>
						</div>
					</div>
				</header>

				{/* Page Content */}
				<div className="p-4 lg:p-8">
					<Outlet context={{ theme }} />
				</div>
			</main>
		</div>
	);
}

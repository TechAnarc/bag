export interface AdminLoginDto {
	email: string;
	password: string;
}

export interface AdminJwtPayload {
	id: string;
	email: string;
	role: "SUPER_ADMIN" | "ADMIN";
	type: "admin";
}

export interface AdminProfileUpdateDto {
	name?: string;
	phone?: string;
	avatar?: string;
}

export interface AdminPasswordUpdateDto {
	currentPassword: string;
	newPassword: string;
}

export interface DashboardStats {
	totalUsers: number;
	totalOrders: number;
	totalProducts: number;
	totalRevenue: number;
	pendingOrders: number;
	outOfStockProducts: number;
	recentUsers: number; // Last 7 days
	recentRevenue: number; // Last 7 days
	upisStats?: {
		highValue: number;
		atRisk: number;
		loyal: number;
		avgConversion: number;
		churnAlerts: number;
		fraudSignals: number;
	};
}

export interface ChartData {
	ordersChart: {
		date: string;
		orders: number;
	}[];
	revenueChart: {
		date: string;
		revenue: number;
	}[];
	categoryChart: {
		category: string;
		count: number;
		value: number;
	}[];
}

export interface AdminLogDto {
	action: string;
	details?: any;
	ipAddress?: string;
	userAgent?: string;
}

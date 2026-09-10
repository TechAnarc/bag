import api from "@/lib/axios";

// Types
export interface Admin {
	id: string;
	name: string;
	email: string;
	role: "SUPER_ADMIN" | "ADMIN";
	avatar: string | null;
	phone: string | null;
	isActive: boolean;
	lastLoginAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface DashboardStats {
	totalUsers: number;
	totalOrders: number;
	totalProducts: number;
	totalRevenue: number;
	pendingOrders: number;
	outOfStockProducts: number;
	recentUsers: number;
	recentRevenue: number;
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
	ordersChart: Array<{ date: string; orders: number }>;
	revenueChart: Array<{ date: string; revenue: number }>;
	categoryChart: Array<{ category: string; count: number; value: number }>;
}

// Authentication - No manual token management
export const adminApi = {
	// Auth
	async login(email: string, password: string) {
		const response = await api.post("/admin/auth/login", { email, password });
		
		// DOUBLE-TAP: Store token immediately in the service layer for reliability
		const token = response.data?.data?.token || response.data?.token;
		if (token) {
			localStorage.setItem("admin_access_token", token);
		}
		
		return response.data;
	},

	async googleLogin(idToken: string) {
		const response = await api.post("/admin/auth/google-login", { idToken });
		
		const token = response.data?.data?.token || response.data?.token;
		if (token) {
			localStorage.setItem("admin_access_token", token);
		}
		
		return response.data;
	},

	async logout() {
		// Call backend to clear cookies
		try {
			await api.post("/admin/auth/logout");
		} catch (error) {
			// Logout locally even if API fails
			console.error("Admin logout error:", error);
		} finally {
			// Always clear local storage fallback
			localStorage.removeItem("admin_access_token");
		}
	},

	// Check authentication by trying to get profile
	async isAuthenticated() {
		try {
			await this.getProfile();
			return true;
		} catch {
			return false;
		}
	},

	// Profile
	async getProfile(config?: any) {
		const response = await api.get("/admin/profile", config);
		return response.data;
	},

	async updateProfile(data: {
		name?: string;
		phone?: string;
		avatar?: string;
	}) {
		const response = await api.put("/admin/profile", data);
		return response.data;
	},

	async updatePassword(currentPassword: string, newPassword: string) {
		const response = await api.put(
			"/admin/profile/password",
			{ currentPassword, newPassword },
		);
		return response.data;
	},

	// Dashboard Stats
	async getDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
		const response = await api.get("/admin/stats/dashboard");
		return response.data;
	},

	async getChartData(days = 30): Promise<{ success: boolean; data: ChartData }> {
		const response = await api.get(`/admin/stats/charts?days=${days}`);
		return response.data;
	},

	// Users
	async getUsers(params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: string;
	}) {
		const queryParams = new URLSearchParams(
			params as Record<string, string>,
		).toString();
		const response = await api.get(`/admin/users?${queryParams}`);
		return response.data;
	},

	async blockUser(userId: string, reason: string) {
		const response = await api.put(
			`/admin/users/${userId}/block`,
			{ reason },
		);
		return response.data;
	},

	async unblockUser(userId: string) {
		const response = await api.put(
			`/admin/users/${userId}/unblock`,
			{},
		);
		return response.data;
	},

	// Orders
	async getOrders(params: {
		page?: number;
		limit?: number;
		status?: string;
		search?: string;
	}) {
		const queryParams = new URLSearchParams(
			params as Record<string, string>,
		).toString();
		const response = await api.get(`/admin/orders?${queryParams}`);
		return response.data;
	},

	async updateOrderStatus(
		orderId: string,
		status: string,
		notes?: string,
	) {
		const response = await api.put(
			`/admin/orders/${orderId}/status`,
			{ status, notes },
		);
		return response.data;
	},

	// Products
	async getProducts(params: {
		page?: number;
		limit?: number;
		category?: string;
		search?: string;
	}) {
		const queryParams = new URLSearchParams(
			params as Record<string, string>,
		).toString();
		const response = await api.get(`/admin/products?${queryParams}`);
		return response.data;
	},

	async updateProduct(productId: string, data: any) {
		const response = await api.put(`/admin/products/${productId}`, data);
		return response.data;
	},

	async deleteProduct(productId: string) {
		const response = await api.delete(`/admin/products/${productId}`);
		return response.data;
	},

	// Intelligence & Commands
	async getAnalytics() {
		const response = await api.get("/admin/analytics");
		return response.data;
	},

	async getOperationalOrders() {
		const response = await api.get("/admin/orders/operational");
		return response.data;
	},

	async getSurveillanceMetrics() {
		const response = await api.get("/admin/surveillance/metrics");
		return response.data;
	},

	async executeCommand(commandType: string, payload: any) {
		const response = await api.post(`/admin/commands/${commandType}`, payload);
		return response.data;
	},

	// Activity Logs
	async getActivityLogs(params: { page?: number; limit?: number }) {
		const queryParams = new URLSearchParams(
			params as Record<string, string>,
		).toString();
		const response = await api.get(`/admin/logs?${queryParams}`);
		return response.data;
	},

	// Contact Inquiries
	async getInquiries(params: { page?: number; limit?: number; isRead?: boolean; isReplied?: boolean }) {
		const queryParams = new URLSearchParams(
			params as any,
		).toString();
		const response = await api.get(`/admin/inquiries?${queryParams}`);
		return response.data;
	},

	async markInquiryAsRead(id: string) {
		const response = await api.patch(`/admin/inquiries/${id}/read`);
		return response.data;
	},

	async sendInquiryReply(id: string, formData: FormData) {
		const response = await api.post(`/admin/inquiries/${id}/reply`, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	},

	// Business Settings
	async getBusinessConfig() {
		const response = await api.get("/admin/settings/business");
		return response.data;
	},

	async updateBusinessConfig(data: any) {
		const response = await api.put("/admin/settings/business", data);
		return response.data;
	},

	// UPIS & Intelligence
	async getUserIntelligence(userId: string) {
		const response = await api.get(`/admin/upis/users/${userId}/intelligence`);
		return response.data;
	},

	// Phase 3: Autonomy & Logistics
	async getDecisionStream(params: {
		category?: string;
		status?: string;
		limit?: number;
		offset?: number;
	}) {
		const queryParams = new URLSearchParams(params as any).toString();
		const response = await api.get(`/admin/autonomy/decisions?${queryParams}`);
		return response.data;
	},

	async getPolicies() {
		const response = await api.get("/admin/autonomy/policies");
		return response.data;
	},

	async updatePolicy(id: string, data: any) {
		const response = await api.put(`/admin/autonomy/policies/${id}`, data);
		return response.data;
	},

	async overrideDecision(id: string, data: { reason: string }) {
		const response = await api.post(`/admin/autonomy/decisions/${id}/override`, data);
		return response.data;
	},

	async getLogisticsPartners() {
		const response = await api.get("/admin/logistics/partners");
		return response.data;
	},

	async getLogisticsPartnerPerformance(id: string) {
		const response = await api.get(`/admin/logistics/partners/${id}/performance`);
		return response.data;
	},

    // Agentic & Intelligence
    async getUsersWithIntelligence(params: {
        page?: number; 
        limit?: number; 
        stage?: string;
        search?: string;
    }) {
        const cleanParams: Record<string, string> = {};
        if (params.page) cleanParams.page = String(params.page);
        if (params.limit) cleanParams.limit = String(params.limit);
        if (params.stage && params.stage !== 'all') cleanParams.stage = params.stage;
        if (params.search) cleanParams.search = params.search;
        const queryParams = new URLSearchParams(cleanParams).toString();
        const response = await api.get(`/admin/upis/users?${queryParams}`);
        return response.data;
    },

    async getVisitorRadar() {
        const response = await api.get("/admin/upis/visitor-radar");
        return response.data;
    },

    async registerMobileDevice(data: {
        deviceId: string;
        fcmToken: string;
        deviceName?: string;
        deviceType?: string;
    }) {
        const response = await api.post("/admin/mobile/register-device", data);
        return response.data;
    },

    // Create Product
    async createProduct(data: any) {
        const response = await api.post('/admin/products', data);
        return response.data;
    },

    // Category CRUD
    async getCategories() {
        const response = await api.get('/categories');
        return response.data;
    },

    async createCategory(data: { name: string; isActive?: boolean }) {
        const response = await api.post('/categories', data);
        return response.data;
    },

    async updateCategory(id: string, data: { name?: string; isActive?: boolean }) {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    async deleteCategory(id: string) {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },

    // Reviews Management
    async getReviews(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
        const queryParams = new URLSearchParams(params as Record<string, string>).toString();
        const response = await api.get(`/reviews/admin?${queryParams}`);
        return response.data;
    },

    async updateReviewStatus(reviewId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
        const response = await api.patch(`/reviews/admin/${reviewId}/status`, { status });
        return response.data;
    },

    async deleteReview(reviewId: string) {
        const response = await api.delete(`/reviews/admin/${reviewId}`);
        return response.data;
    },
};

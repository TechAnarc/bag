import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { adminApi } from "../services/adminApi";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminAuthGuardProps {
	children: ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
	const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
	const location = useLocation();

	useEffect(() => {
		if (status !== "loading") return;

		let mounted = true;

		// Timeout fallback to prevent infinite loading
		const timeoutId = setTimeout(() => {
			if (mounted && status === "loading") {
				console.warn("[AdminAuthGuard] Auth check timed out after 8s, redirecting to login");
				setStatus("unauthenticated");
			}
		}, 8000); // Reduced to 8s for snappier experience. Backend should respond faster.

		const checkAuth = async () => {
			try {
				const adminToken = localStorage.getItem("admin_access_token");
				const hasVisibleCookie = document.cookie.includes("admin_access_token");

				console.log("[AdminAuthGuard] Starting authentication check...", {
					hasCookie: hasVisibleCookie,
					hasLocalStorageToken: !!adminToken
				});

				// If we have absolutely no evidence of a session, we can still check the API (for httpOnly cookies)
				// but we'll do it with a shorter internal timeout if needed.
				const response = await adminApi.getProfile({
					_skipGlobalErrorHandler: true,
					timeout: 7000 // Internal axios timeout
				});

				if (!mounted) return;

				if (response && response.success) {
					console.log("[AdminAuthGuard] ✅ Authentication successful");
					setStatus("authenticated");
				} else {
					console.log("[AdminAuthGuard] ❌ Authentication failed - invalid response");
					setStatus("unauthenticated");
				}
			} catch (error: any) {
				console.error("[AdminAuthGuard] ❌ Authentication error:", error?.response?.status === 401 ? "Unauthorized (401)" : error?.message || error);
				if (mounted) {
					setStatus("unauthenticated");
				}
			} finally {
				clearTimeout(timeoutId);
			}
		};

		checkAuth();

		return () => {
			mounted = false;
			clearTimeout(timeoutId);
		};
	}, [location.pathname]);

	if (status === "loading") {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
				<Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-6" />
				<h2 className="text-xl font-semibold mb-2 text-center">Verifying Administrative Access...</h2>
				<p className="text-slate-400 mb-8 text-center max-w-md">
					We're securing your connection and verifying your high-level clearance. This may take a moment on slower connections.
				</p>

				<div className="flex flex-col gap-3 w-full max-w-xs">
					<Button
						variant="outline"
						className="border-slate-800 hover:bg-slate-900 text-slate-300"
						onClick={() => window.location.reload()}
					>
						Refresh Page
					</Button>
					<Button
						variant="ghost"
						className="text-indigo-400 hover:text-indigo-300"
						onClick={() => setStatus("unauthenticated")}
					>
						Return to Login
					</Button>
				</div>

				<div className="mt-12 p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-500 w-full max-w-md">
					<p className="uppercase font-black tracking-tighter mb-1 border-b border-slate-800 pb-1 text-indigo-400">Mission_Control_Diagnostics</p>
					<p>Cookie_Status: {document.cookie.includes("admin_access_token") ? "DETECTED" : "MASKED/MISSING"}</p>
					<p>Local_Vault: {localStorage.getItem("admin_access_token") ? `ACTIVE (${localStorage.getItem("admin_access_token")?.substring(0, 10)}...)` : "EMPTY"}</p>
					<p>Engine_Mode: PROD_RELIABILITY_V3</p>
					<p>Hostname: {window.location.hostname}</p>
					<p>Path: {window.location.pathname}</p>
					<div className="mt-4 pt-2 border-t border-slate-800 flex flex-col gap-2">
						<p className="text-[8px] text-slate-600 mb-2 italic">If Cookie_Status is MASKED but Local_Vault is ACTIVE, the fix is working as intended.</p>
						<button
							onClick={() => {
								localStorage.clear();
								window.location.href = '/admin/login';
							}}
							className="text-rose-500 underline hover:text-rose-400 text-left"
						>
							FORCE_CLEAR_SESSION_AND_RESTART
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		console.log("[AdminAuthGuard] Redirecting to /admin/login");
		return <Navigate to="/admin/login" state={{ from: location }} replace />;
	}

	console.log("[AdminAuthGuard] ✅ Rendering protected content");
	return <>{children}</>;
}

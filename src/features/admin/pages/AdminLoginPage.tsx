import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "../services/adminApi";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MobileService } from "@/lib/mobileUtils";
import { Capacitor } from "@capacitor/core";

export default function AdminLoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const googleBtnRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const { toast } = useToast();

	// Google GSI loader for Admin
	useEffect(() => {
		let isAttempting = true;
		const init = () => {
			if (!(window as any).google?.accounts?.id) return;
			(window as any).google.accounts.id.initialize({
				client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
				callback: handleGoogleCallback,
				auto_select: false,
				context: "signin",
			});

			const attemptRender = () => {
				if (!isAttempting) return;
				if (googleBtnRef.current) {
					(window as any).google.accounts.id.renderButton(googleBtnRef.current, {
						theme: "outline",
						size: "large",
						type: "standard",
						shape: "rectangular",
						text: "signin_with",
						logo_alignment: "center",
						width: googleBtnRef.current.offsetWidth || 380,
					});
				} else {
					setTimeout(attemptRender, 50);
				}
			};
			attemptRender();
		};

		if (!(window as any).google?.accounts?.id) {
			const s = document.createElement("script");
			s.src = "https://accounts.google.com/gsi/client";
			s.async = true;
			s.defer = true;
			s.onload = init;
			document.head.appendChild(s);
		} else {
			init();
		}

		return () => {
			isAttempting = false;
		};
	}, []);

	const handleGoogleCallback = async (response: any) => {
		if (!response.credential) return;
		setGoogleLoading(true);
		try {
			const res = await adminApi.googleLogin(response.credential);
			if (res.success) {
				const token = res.data?.token || res.token;
				if (token) {
					localStorage.setItem("admin_access_token", token);
					
					if (Capacitor.isNativePlatform()) {
						await MobileService.setPersistentToken(token);
						MobileService.syncFcmTokenAfterLogin();
					}
				}

				toast({
					title: "Login Successful",
					description: `Welcome back, ${res.data?.admin?.name || 'Admin'}!`,
				});

				setTimeout(() => {
					navigate("/admin/dashboard");
				}, 500);
			} else {
				toast({
					variant: "destructive",
					title: "Login Failed",
					description: res.message || "Invalid credentials",
				});
			}
		} catch (err: any) {
			console.error("Google Sign-In Failed:", err);
			toast({
				variant: "destructive",
				title: "Google Sign-In Failed",
				description: err.response?.data?.message || "Only authorized admin email ids are allowed.",
			});
		} finally {
			setGoogleLoading(false);
		}
	};

	// Redirect if already logged in
	useEffect(() => {
		const checkSession = async () => {
			let token = localStorage.getItem("admin_access_token");
			
			// Mobile fallback to persistent storage
			if (!token && Capacitor.isNativePlatform()) {
				token = await MobileService.getPersistentToken();
				if (token) {
					localStorage.setItem("admin_access_token", token);
				}
			}

			if (token) {
				try {
					const response = await adminApi.getProfile({ _skipGlobalErrorHandler: true });
					if (response && response.success) {
						navigate("/admin/dashboard");
					}
				} catch (e) {
					// Session invalid, stay on login page
					localStorage.removeItem("admin_access_token");
				}
			}
		};
		checkSession();
	}, [navigate]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		const trimmedEmail = email.trim();
		const trimmedPassword = password.trim();

		console.log("Attempting admin login with:", { email: trimmedEmail });

		if (!trimmedEmail || !trimmedPassword) {
			toast({
				variant: "destructive",
				title: "Validation Error",
				description: "Please fill in both email and password fields",
			});
			return;
		}

		// Basic email validation on frontend
		if (!trimmedEmail.includes("@")) {
			toast({
				variant: "destructive",
				title: "Validation Error",
				description: "Please enter a valid email address",
			});
			return;
		}

		setLoading(true);
		try {
			const response = await adminApi.login(trimmedEmail, trimmedPassword);
			console.log("Login response received:", {
				success: response.success,
				hasData: !!response.data,
				hasToken: !!(response.data?.token || response.token)
			});

			if (response.success) {
				// BULLETPROOF TOKEN STORAGE: Check both response.data.token and response.token
				const token = response.data?.token || response.token;
				if (token) {
					localStorage.setItem("admin_access_token", token);
					
						// Mobile persistent storage
					if (Capacitor.isNativePlatform()) {
						await MobileService.setPersistentToken(token);
						// Sync FCM token now that we have a valid session
						MobileService.syncFcmTokenAfterLogin();
					}
					
					console.log("✅ Admin token secured in LocalVault fallback");
				} else {
					console.warn("⚠️ No token found in login response payload");
				}

				toast({
					title: "Login Successful",
					description: `Welcome back, ${response.data?.admin?.name || 'Admin'}!`,
				});

				// Wait a tiny bit for storage/cookies to settle on mobile
				setTimeout(() => {
					console.log("🚀 Initiating secure redirect to dashboard...");
					navigate("/admin/dashboard");
				}, 500);
			} else {
				toast({
					variant: "destructive",
					title: "Login Failed",
					description: response.message || "Invalid credentials",
				});
			}
		} catch (error: any) {
			console.error("Login catch error:", error);

			// Extract specific validation errors if available
			const backendError = error.response?.data;
			let errorMessage = "An error occurred during login";

			if (backendError?.errors && Array.isArray(backendError.errors)) {
				errorMessage = backendError.errors[0]?.message || backendError.message || errorMessage;
			} else if (backendError?.message) {
				errorMessage = backendError.message;
			}

			toast({
				variant: "destructive",
				title: "Login Error",
				description: errorMessage,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 font-sans">
			{/* Animated Background */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse delay-700"></div>
			</div>

			{/* Login Card */}
			<Card className="w-full max-w-md relative z-10 bg-slate-900/80 backdrop-blur-xl border-slate-700 shadow-2xl">
				<CardHeader className="space-y-4">
					<div className="mx-auto w-24 h-24 overflow-hidden flex items-center justify-center">
						<img src="/assets/triveni-brand-logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
					</div>
					<CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
						Admin Portal
					</CardTitle>
					<CardDescription className="text-center text-slate-400">
						Enter your credentials to access the dashboard
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Google Login CTA */}
					<div className="space-y-4">
						<div className="relative w-full min-h-[50px] rounded-lg overflow-hidden border border-slate-700 bg-slate-800/20 hover:bg-slate-800/40 active:scale-[0.99] transition-all flex items-center justify-center">
							{googleLoading && (
								<div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/90">
									<Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
								</div>
							)}
							<div ref={googleBtnRef} className="w-full h-full flex justify-center google-btn-container" />
						</div>

						{/* Divider */}
						<div className="relative flex items-center py-1">
							<div className="flex-grow border-t border-slate-800" />
							<span className="mx-4 text-[10px] font-bold tracking-widest uppercase text-slate-500 select-none">
								or continue with credentials
							</span>
							<div className="flex-grow border-t border-slate-800" />
						</div>
					</div>

					<form onSubmit={handleLogin} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="email" className="text-slate-300">
								Email Address
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="triveni1gram@gmail.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-slate-300">
								Password
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
									disabled={loading}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Authenticating...
								</>
							) : (
								"Sign In"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Footer */}
			<div className="absolute bottom-8 left-0 right-0 text-center">
				<p className="text-slate-500 text-sm">
					© {new Date().getFullYear()} Triveni 1 Gram Jewellers. All rights reserved.
				</p>
			</div>

			{/* Debug Info (Only in Development) */}
			{import.meta.env.MODE === 'development' && (
				<div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-500">
					<p className="mb-2 uppercase font-bold text-slate-400">Diagnostic Hub</p>
					<div className="space-y-1">
						<p>API URL: {import.meta.env.VITE_API_BASE_URL || 'DEFAULT (8080)'}</p>
						<p>Current Path: {window.location.pathname}</p>
						<p>Browser Mode: {import.meta.env.MODE}</p>
						<div className="pt-2 border-t border-slate-800 mt-2">
							<button
								onClick={async () => {
									try {
										const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/health`);
										const data = await res.json();
										alert(`Backend Health: ${JSON.stringify(data)}`);
									} catch (e) {
										alert(`Backend Unreachable: ${e}`);
									}
								}}
								className="text-indigo-400 hover:text-indigo-300 underline"
							>
								Run Remote Connectivity Test
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

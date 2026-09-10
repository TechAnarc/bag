import { z } from "zod";

export const registerSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(10, "Phone number must be at least 10 digits"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	verificationMethod: z.enum(["EMAIL", "PHONE"]).default("EMAIL"),
});

export const loginSchema = z.object({
	emailOrPhone: z.string().min(1, "Email or phone is required"),
	password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
	requestId: z.string().min(1, "Request ID is required"),
	otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resendOtpSchema = z.object({
	target: z.string().min(1, "Target (email or phone) is required"),
	type: z.enum([
		"REGISTER",
		"LOGIN",
		"RESET",
		"TWO_FACTOR",
		"CHANGE_PHONE",
		"CHANGE_EMAIL",
	]),
});

export const requestMobileOtpSchema = z.object({
	phone: z
		.string()
		.regex(
			/^[6-9]\d{9}$/,
			"Please enter a valid 10-digit Indian mobile number",
		),
});

export const googleAuthSchema = z.object({
	idToken: z.string().min(1, "Google ID Token is required"),
});

export const supabaseAuthSchema = z.object({
	accessToken: z.string().min(1, "Supabase Session Token is required"),
});

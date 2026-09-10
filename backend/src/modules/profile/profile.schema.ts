import { z } from "zod";

const addressSchema = z.object({
	street: z.string().min(5, "Street address must be at least 5 characters"),
	city: z.string().min(2, "City must be at least 2 characters"),
	state: z.string().min(2, "State must be at least 2 characters"),
	pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
	country: z.string().default("India"),
});

export const updateProfileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters").optional(),
	phone: z
		.string()
		.regex(/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit number")
		.optional()
		.nullable(),
	address: addressSchema.optional().nullable(),
	avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Password must contain at least one uppercase letter, one lowercase letter, and one number",
			),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

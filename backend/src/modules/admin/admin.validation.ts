import { z } from "zod";

export const adminLoginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const adminProfileUpdateSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters").optional(),
	phone: z
		.string()
		.regex(/^[0-9]{10}$/, "Phone must be 10 digits")
		.optional(),
	avatar: z.string().url("Invalid avatar URL").optional(),
});

export const adminPasswordUpdateSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z
		.string()
		.min(8, "New password must be at least 8 characters")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
			"Password must contain uppercase, lowercase, number and special character",
		),
});

export const blockUserSchema = z.object({
	reason: z.string().min(5, "Block reason must be at least 5 characters"),
});

export const updateOrderStatusSchema = z.object({
	status: z.enum([
		"PENDING",
		"PROCESSING",
		"CONFIRMED",
		"SHIPPED",
		"DELIVERED",
		"CANCELLED",
		"REFUNDED",
	]),
	notes: z.string().optional(),
});

export const createProductSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		categoryId: z.string().min(1, "Category is required"),
		price: z.number().positive("Price must be positive"), // Keeping for compatibility, usually maps to sellingPrice
		basePrice: z.number().positive("Base price must be positive"),
		sellingPrice: z.number().positive("Selling price must be positive"),
		ownerPrice: z
			.number()
			.nonnegative("Owner price must be zero or positive")
			.optional(),
		sku: z.string().optional(), // Auto-generated server-side if not provided
		description: z.string().optional(),
		shortTagline: z.string().optional(),
		platingType: z.string().optional(),
		images: z.array(z.string()).min(1, "At least 1 product image is required"),
		specifications: z
			.object({
				weight: z.string().optional(),
				material: z.string().optional(),
				occasion: z.string().optional(),
				brand: z.string().optional(),
				packageContents: z.string().optional(),
			})
			.optional(),
		inventory: z
			.object({
				quantity: z.number().int().min(0).optional(),
				inStock: z.boolean().optional(),
			})
			.optional(),
		seo: z
			.object({
				metaTitle: z.string().optional(),
				metaDescription: z.string().optional(),
			})
			.optional(),
	})
	.refine((data) => data.sellingPrice <= data.basePrice, {
		message: "Selling price cannot be greater than base price (MRP)",
		path: ["sellingPrice"],
	});

export const updateProductSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters").optional(),
	categoryId: z.string().optional(),
	description: z.string().optional(),
	price: z.number().positive().optional(),
	basePrice: z.number().positive().optional(),
	sellingPrice: z.number().positive().optional(),
	ownerPrice: z.number().nonnegative().optional(),
	sku: z.string().optional(),
	images: z.array(z.string()).optional(),
	specifications: z.any().optional(),
	inventory: z.any().optional(),
	seo: z.any().optional(),
	isActive: z.boolean().optional(),
	isFeatured: z.boolean().optional(),
	isTrending: z.boolean().optional(),
	platingType: z.string().optional(),
	shortTagline: z.string().optional(),
	status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

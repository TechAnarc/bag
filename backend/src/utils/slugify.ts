/**
 * 🧬 Centralized Shared Slug Engine
 * Guarantee deterministic, SEO-hardened canonical URL slugs across the entire ecosystem.
 */
export const slugify = (value: string): string => {
	if (!value || typeof value !== "string") return "";

	return value
		.toLowerCase()
		.trim()
		.replace(/&/g, "and") // Convert ampersands
		.normalize("NFD") // Normalize unicode
		.replace(/[\u0300-\u036f]/g, "") // Strip diacritics
		.replace(/[^\w\s-]/g, "") // Strip special chars except hyphen/spaces
		.replace(/\s+/g, "-") // Collapse spaces to single hyphen
		.replace(/-+/g, "-") // Collapse multiple hyphens
		.replace(/^-+|-+$/g, ""); // Trim hyphens from start/end
};

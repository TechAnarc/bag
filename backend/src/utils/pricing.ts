/**
 * Global Pricing Engine for Triveni Commerce
 * Single source of truth for all pricing calculations.
 */

export interface PricingTotals {
	mrp_total: number;
	discount_total: number;
	item_total: number; // The sum of (price * quantity) after individual item discounts
	platform_fee: number; // 3% of item_total
	tax: number; // 3% of item_total (GST)
	shipping: number; // Free above 4999, else fixed charge
	grand_total: number;
	cash_roundoff: number;
	final_payable: number;
	total_saved: number;
}

export const PRICING_CONFIG = {
	GST_RATE: 0.03, // 3%
	PLATFORM_FEE_RATE: 0.03, // 3%
	SHIPPING_THRESHOLD: 4999,
	SHIPPING_CHARGE: 50, // Standard shipping for bags
};

export function calculateOrderTotals(
	items: { price: number; mrp: number; quantity: number }[],
	deliveryMethod?: string,
): PricingTotals {
	// 1. Calculate Base Item Totals
	const mrp_total = items.reduce(
		(sum, item) => sum + (item.mrp || item.price * 1.5) * item.quantity,
		0,
	);
	const item_total = items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);
	const discount_total = mrp_total - item_total;

	// 2. Platform Fee & Tax (calculated as part of item_total/reporting, already included in selling price)
	const platform_fee = Math.round(
		item_total * PRICING_CONFIG.PLATFORM_FEE_RATE,
	);
	const tax = Math.round(item_total * PRICING_CONFIG.GST_RATE);

	// 3. Shipping Calculation (Home Delivery Only)
	const shipping =
		item_total >= PRICING_CONFIG.SHIPPING_THRESHOLD
			? 0
			: PRICING_CONFIG.SHIPPING_CHARGE;

	// 4. Initial Grand Total (GST & Platform Fee are included in price, not added additionally)
	const raw_grand_total = item_total + shipping;

	// 5. Cash Roundoff Logic
	// Rule: If decimal < 0.5 -> round down, If decimal >= 0.5 -> round up
	// Math.round() already implements this precisely.
	const final_payable = Math.round(raw_grand_total);
	const cash_roundoff = Number((final_payable - raw_grand_total).toFixed(2));

	// 6. Total Saved (MRP - Final Payable)
	const total_saved = mrp_total - item_total;

	return {
		mrp_total,
		discount_total,
		item_total,
		platform_fee,
		tax,
		shipping,
		grand_total: raw_grand_total,
		cash_roundoff,
		final_payable,
		total_saved,
	};
}

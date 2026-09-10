/**
 * GST Calculation Engine
 * Handles automatic CGST/SGST/IGST calculation based on state
 */

// Indian State Codes for GST
export const GST_STATE_CODES: Record<string, string> = {
	"Andaman and Nicobar Islands": "35",
	"Andhra Pradesh": "37",
	"Arunachal Pradesh": "12",
	Assam: "18",
	Bihar: "10",
	Chandigarh: "04",
	Chhattisgarh: "22",
	"Dadra and Nagar Haveli and Daman and Diu": "26",
	Delhi: "07",
	Goa: "30",
	Gujarat: "24",
	Haryana: "06",
	"Himachal Pradesh": "02",
	"Jammu and Kashmir": "01",
	Jharkhand: "20",
	Karnataka: "29",
	Kerala: "32",
	Ladakh: "38",
	Lakshadweep: "31",
	"Madhya Pradesh": "23",
	Maharashtra: "27",
	Manipur: "14",
	Meghalaya: "17",
	Mizoram: "15",
	Nagaland: "13",
	Odisha: "21",
	Puducherry: "34",
	Punjab: "03",
	Rajasthan: "08",
	Sikkim: "11",
	"Tamil Nadu": "33",
	Telangana: "36",
	Tripura: "16",
	"Uttar Pradesh": "09",
	Uttarakhand: "05",
	"West Bengal": "19",
};

// Standard GST Rates for different product categories
export const GST_RATES = {
	BAGS: 18, // 18% for bags
	GENERAL_GOODS: 18, // 18% for general goods
	GENERAL: 18, // Changed from 3 to 18 for Bags priority
	ESSENTIAL: 5, // 5% for essential goods
	LUXURY: 28, // 28% for luxury goods
};

interface GSTCalculationInput {
	subtotal: number;
	discount?: number;
	shippingCharge?: number;
	codCharge?: number;
	gstRate: number; // Percentage (e.g., 3 for 3%)
	sellerState: string; // State name
	buyerState: string; // State name
}

interface GSTCalculationResult {
	taxableAmount: number;
	cgst: number;
	sgst: number;
	igst: number;
	totalGST: number;
	grandTotal: number;
	gstType: "INTRA_STATE" | "INTER_STATE";
	roundingAdjustment: number;
}

/**
 * Calculate GST with automatic CGST/SGST or IGST split
 */
export function calculateGST(input: GSTCalculationInput): GSTCalculationResult {
	const {
		subtotal,
		discount = 0,
		shippingCharge = 0,
		codCharge = 0,
		gstRate,
		sellerState,
		buyerState,
	} = input;

	// Calculate taxable amount
	const taxableAmount = subtotal - discount;

	// Check if intra-state (same state) or inter-state (different states)
	const isIntraState = sellerState === buyerState;
	const gstType: "INTRA_STATE" | "INTER_STATE" = isIntraState
		? "INTRA_STATE"
		: "INTER_STATE";

	let cgst = 0;
	let sgst = 0;
	let igst = 0;

	if (isIntraState) {
		// For intra-state: Split into CGST and SGST (each half of total GST rate)
		const halfRate = gstRate / 2;
		cgst = (taxableAmount * halfRate) / 100;
		sgst = (taxableAmount * halfRate) / 100;
	} else {
		// For inter-state: Use IGST (full GST rate)
		igst = (taxableAmount * gstRate) / 100;
	}

	const totalGST = cgst + sgst + igst;

	// Calculate grand total
	const rawGrandTotal = taxableAmount + totalGST + shippingCharge + codCharge;

	// Apply rounding to nearest rupee
	const grandTotal = Math.round(rawGrandTotal);
	const roundingAdjustment = grandTotal - rawGrandTotal;

	return {
		taxableAmount,
		cgst: roundToTwoDecimals(cgst),
		sgst: roundToTwoDecimals(sgst),
		igst: roundToTwoDecimals(igst),
		totalGST: roundToTwoDecimals(totalGST),
		grandTotal,
		gstType,
		roundingAdjustment: roundToTwoDecimals(roundingAdjustment),
	};
}

/**
 * Get GST state code from state name
 */
export function getStateCode(stateName: string): string {
	return GST_STATE_CODES[stateName] || "";
}

/**
 * Validate GSTIN format
 * Format: 24ABCDE1234F1Z5 (15 characters)
 * First 2 chars: State code
 * Next 10 chars: PAN
 * Next 1 char: Entity number
 * Next 1 char: 'Z' by default
 * Last 1 char: Checksum
 */
export function validateGSTIN(gstin: string): boolean {
	if (!gstin || gstin.length !== 15) {
		return false;
	}

	const gstinRegex =
		/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
	return gstinRegex.test(gstin);
}

/**
 * Validate PAN format
 * Format: ABCDE1234F (10 characters)
 */
export function validatePAN(pan: string): boolean {
	if (!pan || pan.length !== 10) {
		return false;
	}

	const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
	return panRegex.test(pan);
}

/**
 * Extract PAN from GSTIN
 */
export function extractPANFromGSTIN(gstin: string): string {
	if (!validateGSTIN(gstin)) {
		return "";
	}

	return gstin.substring(2, 12);
}

/**
 * Get state name from GSTIN
 */
export function getStateFromGSTIN(gstin: string): string {
	if (!validateGSTIN(gstin)) {
		return "";
	}

	const stateCode = gstin.substring(0, 2);

	for (const [stateName, code] of Object.entries(GST_STATE_CODES)) {
		if (code === stateCode) {
			return stateName;
		}
	}

	return "";
}

/**
 * Round to 2 decimal places
 */
function roundToTwoDecimals(num: number): number {
	return Math.round(num * 100) / 100;
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

/**
 * Format currency without symbol
 */
export function formatAmount(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

/**
 * Get fiscal year from date
 * Indian fiscal year: April 1 to March 31
 */
export function getFiscalYear(date: Date = new Date()): string {
	const year = date.getFullYear();
	const month = date.getMonth(); // 0-indexed

	// If month is Jan, Feb, or Mar (0, 1, 2), fiscal year is (previous year - current year)
	// If month is Apr to Dec (3-11), fiscal year is (current year - next year)
	if (month < 3) {
		return `${year - 1}-${year.toString().slice(-2)}`;
	}
	return `${year}-${(year + 1).toString().slice(-2)}`;
}

/**
 * Calculate HSN-wise tax breakup
 */
export interface HSNTaxItem {
	hsnCode: string;
	taxableValue: number;
	cgst?: number;
	sgst?: number;
	igst?: number;
	totalTax: number;
}

export function calculateHSNTaxBreakup(
	items: Array<{
		hsnCode: string;
		price: number;
		quantity: number;
		discount: number;
	}>,
	gstRate: number,
	isIntraState: boolean,
): HSNTaxItem[] {
	const hsnMap = new Map<string, number>();

	// Group by HSN code
	for (const item of items) {
		const taxableValue = item.price * item.quantity - item.discount;
		const current = hsnMap.get(item.hsnCode) || 0;
		hsnMap.set(item.hsnCode, current + taxableValue);
	}

	// Calculate tax for each HSN
	const result: HSNTaxItem[] = [];

	for (const [hsnCode, taxableValue] of hsnMap.entries()) {
		let cgst: number | undefined;
		let sgst: number | undefined;
		let igst: number | undefined;

		if (isIntraState) {
			const halfRate = gstRate / 2;
			cgst = (taxableValue * halfRate) / 100;
			sgst = (taxableValue * halfRate) / 100;
		} else {
			igst = (taxableValue * gstRate) / 100;
		}

		const totalTax = roundToTwoDecimals(
			(cgst || 0) + (sgst || 0) + (igst || 0),
		);

		result.push({
			hsnCode,
			taxableValue: roundToTwoDecimals(taxableValue),
			cgst: cgst ? roundToTwoDecimals(cgst) : undefined,
			sgst: sgst ? roundToTwoDecimals(sgst) : undefined,
			igst: igst ? roundToTwoDecimals(igst) : undefined,
			totalTax,
		});
	}

	return result;
}

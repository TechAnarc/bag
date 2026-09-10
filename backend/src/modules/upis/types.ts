/**
 * UPIS Core Types & Enums
 * Shared types across all UPIS modules
 */

// ====================================
// ACCOUNT STATUS & VERIFICATION
// ====================================

export enum AccountStatus {
	ACTIVE = "ACTIVE",
	SUSPENDED = "SUSPENDED",
	BLOCKED = "BLOCKED",
	DELETED = "DELETED",
}

export enum VerificationLevel {
	BASIC = "BASIC",
	EMAIL_VERIFIED = "EMAIL_VERIFIED",
	PHONE_VERIFIED = "PHONE_VERIFIED",
	KYC_VERIFIED = "KYC_VERIFIED",
}

export enum LoyaltyTier {
	BRONZE = "BRONZE",
	SILVER = "SILVER",
	GOLD = "GOLD",
	PLATINUM = "PLATINUM",
	DIAMOND = "DIAMOND",
}

// ====================================
// ACTIVITY TYPES
// ====================================

export enum ActivityType {
	// Browsing
	VIEW_PRODUCT = "VIEW_PRODUCT",
	VIEW_CATEGORY = "VIEW_CATEGORY",
	VIEW_COLLECTION = "VIEW_COLLECTION",
	SEARCH = "SEARCH",

	// Cart & Wishlist
	ADD_TO_CART = "ADD_TO_CART",
	REMOVE_FROM_CART = "REMOVE_FROM_CART",
	ADD_TO_WISHLIST = "ADD_TO_WISHLIST",
	REMOVE_FROM_WISHLIST = "REMOVE_FROM_WISHLIST",

	// Checkout & Orders
	CHECKOUT_INITIATED = "CHECKOUT_INITIATED",
	ORDER_PLACED = "ORDER_PLACED",
	ORDER_COMPLETED = "ORDER_COMPLETED",
	ORDER_CANCELLED = "ORDER_CANCELLED",

	// Auth
	LOGIN = "LOGIN",
	LOGOUT = "LOGOUT",
	LOGIN_FAILED = "LOGIN_FAILED",
	PASSWORD_CHANGED = "PASSWORD_CHANGED",

	// Profile
	PROFILE_UPDATED = "PROFILE_UPDATED",
	ADDRESS_ADDED = "ADDRESS_ADDED",

	// Reviews
	REVIEW_SUBMITTED = "REVIEW_SUBMITTED",
	REVIEW_UPDATED = "REVIEW_UPDATED",

	// Support
	TICKET_CREATED = "TICKET_CREATED",
	TICKET_REPLIED = "TICKET_REPLIED",

	// Other
	PAGE_VIEW = "PAGE_VIEW",
	VIDEO_WATCHED = "VIDEO_WATCHED",
	SHARE = "SHARE",
}

export enum EntityType {
	PRODUCT = "PRODUCT",
	CATEGORY = "CATEGORY",
	ORDER = "ORDER",
	PAGE = "PAGE",
	REVIEW = "REVIEW",
	TICKET = "TICKET",
	COLLECTION = "COLLECTION",
}

// ====================================
// LOYALTY & TRANSACTIONS
// ====================================

export enum LoyaltyTransactionType {
	EARNED = "EARNED",
	REDEEMED = "REDEEMED",
	EXPIRED = "EXPIRED",
	ADJUSTED = "ADJUSTED",
	REFUNDED = "REFUNDED",
	BONUS = "BONUS",
}

export enum LoyaltySource {
	PURCHASE = "PURCHASE",
	REFERRAL = "REFERRAL",
	BIRTHDAY = "BIRTHDAY",
	ANNIVERSARY = "ANNIVERSARY",
	ADMIN = "ADMIN",
	CAMPAIGN = "CAMPAIGN",
	SIGNUP = "SIGNUP",
	REVIEW = "REVIEW",
}

// ====================================
// COMMUNICATION
// ====================================

export enum CommunicationType {
	EMAIL = "EMAIL",
	SMS = "SMS",
	PUSH = "PUSH",
	WHATSAPP = "WHATSAPP",
	IN_APP = "IN_APP",
}

export enum CommunicationChannel {
	MARKETING = "MARKETING",
	TRANSACTIONAL = "TRANSACTIONAL",
	SUPPORT = "SUPPORT",
	NOTIFICATION = "NOTIFICATION",
}

export enum CommunicationStatus {
	QUEUED = "QUEUED",
	SENT = "SENT",
	DELIVERED = "DELIVERED",
	OPENED = "OPENED",
	CLICKED = "CLICKED",
	BOUNCED = "BOUNCED",
	FAILED = "FAILED",
}

// ====================================
// DEVICE
// ====================================

export enum DeviceType {
	MOBILE = "MOBILE",
	DESKTOP = "DESKTOP",
	TABLET = "TABLET",
}

// ====================================
// NOTES & ADMIN
// ====================================

export enum NoteCategory {
	GENERAL = "GENERAL",
	SUPPORT = "SUPPORT",
	RISK = "RISK",
	VIP = "VIP",
	FLAG = "FLAG",
	FEEDBACK = "FEEDBACK",
}

export enum NotePriority {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	URGENT = "URGENT",
}

// ====================================
// SCORING THRESHOLDS
// ====================================

export const SCORING_THRESHOLDS = {
	// Engagement Score (0-1)
	ENGAGEMENT: {
		HIGH: 0.7,
		MEDIUM: 0.4,
		LOW: 0.2,
	},

	// Churn Risk (0-1)
	CHURN: {
		HIGH: 0.7,
		MEDIUM: 0.4,
		LOW: 0.2,
	},

	// Fraud Risk (0-1)
	FRAUD: {
		HIGH: 0.7,
		MEDIUM: 0.4,
		LOW: 0.2,
	},

	// Security Score (0-100)
	SECURITY: {
		STRONG: 80,
		GOOD: 60,
		WEAK: 40,
	},

	// Device Trust (0-1)
	DEVICE_TRUST: {
		TRUSTED: 0.8,
		NEUTRAL: 0.5,
		SUSPICIOUS: 0.3,
	},
} as const;

// ====================================
// LOYALTY TIER CONFIGURATION
// ====================================

export const LOYALTY_TIER_CONFIG = {
	[LoyaltyTier.BRONZE]: {
		minSpend: 0,
		pointsMultiplier: 1,
		benefits: ["Basic support", "Birthday bonus"],
	},
	[LoyaltyTier.SILVER]: {
		minSpend: 10000,
		pointsMultiplier: 1.2,
		benefits: ["Priority support", "Early access to sales", "Birthday bonus"],
	},
	[LoyaltyTier.GOLD]: {
		minSpend: 25000,
		pointsMultiplier: 1.5,
		benefits: [
			"VIP support",
			"Exclusive deals",
			"Free shipping",
			"Birthday bonus",
		],
	},
	[LoyaltyTier.PLATINUM]: {
		minSpend: 50000,
		pointsMultiplier: 2,
		benefits: [
			"Dedicated manager",
			"Premium deals",
			"Free express shipping",
			"Birthday bonus",
			"Anniversary gifts",
		],
	},
	[LoyaltyTier.DIAMOND]: {
		minSpend: 100000,
		pointsMultiplier: 2.5,
		benefits: [
			"All Platinum benefits",
			"Invite-only events",
			"Personalized consultation",
			"Custom jewelry design",
		],
	},
} as const;

// ====================================
// POINTS CONFIGURATION
// ====================================

export const POINTS_CONFIG = {
	// Earning
	EARN_PER_100_SPENT: 10, // 10 points per ₹100
	SIGNUP_BONUS: 100,
	REFERRAL_BONUS: 500,
	REVIEW_BONUS: 50,
	BIRTHDAY_BONUS: 250,
	ANNIVERSARY_BONUS: 500,

	// Redemption
	REDEMPTION_MIN_POINTS: 100,
	REDEMPTION_VALUE_PER_POINT: 0.5, // ₹0.50 per point

	// Expiry
	POINTS_EXPIRY_DAYS: 365,
} as const;

// ====================================
// ACTIVITY SCORING WEIGHTS
// ====================================

export const ACTIVITY_SCORING_WEIGHTS = {
	[ActivityType.VIEW_PRODUCT]: 1,
	[ActivityType.SEARCH]: 2,
	[ActivityType.ADD_TO_CART]: 5,
	[ActivityType.ADD_TO_WISHLIST]: 3,
	[ActivityType.CHECKOUT_INITIATED]: 8,
	[ActivityType.ORDER_PLACED]: 15,
	[ActivityType.ORDER_COMPLETED]: 20,
	[ActivityType.REVIEW_SUBMITTED]: 10,
	[ActivityType.LOGIN]: 1,
} as const;

// ====================================
// TYPE GUARDS
// ====================================

export function isHighEngagement(score: number): boolean {
	return score >= SCORING_THRESHOLDS.ENGAGEMENT.HIGH;
}

export function isHighChurnRisk(score: number): boolean {
	return score >= SCORING_THRESHOLDS.CHURN.HIGH;
}

export function isHighFraudRisk(score: number): boolean {
	return score >= SCORING_THRESHOLDS.FRAUD.HIGH;
}

export function isStrongSecurity(score: number): boolean {
	return score >= SCORING_THRESHOLDS.SECURITY.STRONG;
}

export function isTrustedDevice(score: number): boolean {
	return score >= SCORING_THRESHOLDS.DEVICE_TRUST.TRUSTED;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

export function getTierBySpend(lifetimeSpend: number): LoyaltyTier {
	if (lifetimeSpend >= LOYALTY_TIER_CONFIG.DIAMOND.minSpend) {
		return LoyaltyTier.DIAMOND;
	}
	if (lifetimeSpend >= LOYALTY_TIER_CONFIG.PLATINUM.minSpend) {
		return LoyaltyTier.PLATINUM;
	}
	if (lifetimeSpend >= LOYALTY_TIER_CONFIG.GOLD.minSpend) {
		return LoyaltyTier.GOLD;
	}
	if (lifetimeSpend >= LOYALTY_TIER_CONFIG.SILVER.minSpend) {
		return LoyaltyTier.SILVER;
	}
	return LoyaltyTier.BRONZE;
}

export function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
	const tiers = [
		LoyaltyTier.BRONZE,
		LoyaltyTier.SILVER,
		LoyaltyTier.GOLD,
		LoyaltyTier.PLATINUM,
		LoyaltyTier.DIAMOND,
	];
	const currentIndex = tiers.indexOf(currentTier);
	return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

export function getPointsToNextTier(
	currentTier: LoyaltyTier,
	lifetimeSpend: number,
): number {
	const nextTier = getNextTier(currentTier);
	if (!nextTier) return 0;

	const nextTierMinSpend = LOYALTY_TIER_CONFIG[nextTier].minSpend;
	const remainingSpend = nextTierMinSpend - lifetimeSpend;

	// Convert to points needed
	return Math.ceil((remainingSpend / 100) * POINTS_CONFIG.EARN_PER_100_SPENT);
}

export function calculatePointsFromSpend(
	amount: number,
	tier: LoyaltyTier,
): number {
	const basePoints =
		Math.floor(amount / 100) * POINTS_CONFIG.EARN_PER_100_SPENT;
	const multiplier = LOYALTY_TIER_CONFIG[tier].pointsMultiplier;
	return Math.floor(basePoints * multiplier);
}

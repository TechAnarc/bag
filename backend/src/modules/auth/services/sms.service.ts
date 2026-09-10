import { logger } from "../../../config/logger";

export class SmsService {
	private isConfigured: boolean = false;

	constructor() {
		// Placeholder for SMS provider configuration (e.g. Twilio, MSG91)
		if (process.env.SMS_API_KEY) {
			this.isConfigured = true;
		} else {
			logger.warn(
				"[Sms] SMS provider not configured. SMS features will be disabled.",
			);
		}
	}

	async sendSms(phone: string, message: string) {
		if (!this.isConfigured) {
			logger.info(`[Sms] SMS would be sent to ${phone}: ${message}`);
			return true;
		}

		try {
			// Integration logic here
			logger.info(`[Sms] Sending real SMS to ${phone}`);
			return true;
		} catch (error) {
			logger.error("[Sms] Send Error:", error);
			return false;
		}
	}

	async sendOTP(phone: string, otp: string) {
		if (otp === "SUPABASE_MANAGED") {
			logger.info(
				`[Sms] Delivery bypassed: OTP is managed and dispatched by Supabase Auth directly.`,
			);
			return true;
		}
		const message = `Your Bombay Bag House verification code is ${otp}. Valid for 5 minutes. Do not share this with anyone.`;
		return this.sendSms(phone, message);
	}
}

export const smsService = new SmsService();

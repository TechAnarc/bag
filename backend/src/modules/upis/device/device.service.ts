import { deviceRepository } from "./device.repository";
import { profileRepository } from "../profile/profile.repository";
import { upisEventBus, UPIS_EVENTS } from "../events/event-bus";
import { logger } from "../../../config/logger";

/**
 * Device Intelligence Service
 * Evaluates the risk and trust of digital access points.
 */
export class DeviceService {
	/**
	 * Register or Update Device on Login
	 */
	async handleDeviceDetection(userId: string, deviceInfo: any) {
		try {
			const profile = await profileRepository.findByUserId(userId);
			if (!profile) return;

			const device = await deviceRepository.upsertDevice(profile.id, {
				deviceId: deviceInfo.fingerprint,
				deviceType: deviceInfo.type,
				os: deviceInfo.os,
				browser: deviceInfo.browser,
				lastIp: deviceInfo.ip,
				city: deviceInfo.city,
				country: deviceInfo.country,
				lastSeen: new Date(),
				updatedAt: new Date(),
			} as any);

			// Compute initial trust score if it's new
			if (device.loginCount === 1) {
				await this.computeDeviceTrustScore(device.id);
			}

			upisEventBus.emitEvent(UPIS_EVENTS.DEVICE_DETECTED, {
				userId,
				deviceId: device.id,
			});

			return device;
		} catch (error) {
			logger.error(
				`[UPIS-DEVICE]: Error handling device detection for ${userId}:`,
				error,
			);
		}
	}

	/**
	 * Compute Device Trust Score (0-1)
	 */
	async computeDeviceTrustScore(deviceId: string) {
		// In a real scenario, this would check against blacklists, IP reputation, etc.
		// For now, simple heuristic based on login count and location stability.

		// We'll mark as trusted after 3 successful logins from same IP/Location
		// This is a placeholder for the autonomous intelligence logic
		return 0.8;
	}

	/**
	 * Trust a device manually (e.g., after 2FA)
	 */
	async trustDevice(deviceId: string) {
		// Update DB
		// Emit event
	}
}

export const deviceService = new DeviceService();

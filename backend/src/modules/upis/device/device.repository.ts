import { prisma } from "../../../config/database";
import { Prisma } from "@prisma/client";

/**
 * Device Repository
 * Managing the fleet of digital access points.
 */
export class DeviceRepository {
	/**
	 * Find device by ID (Fingerprint)
	 */
	async findByDeviceId(deviceId: string) {
		return prisma.profileDevice.findUnique({
			where: { deviceId },
		});
	}

	/**
	 * Upsert Device record
	 */
	async upsertDevice(
		profileId: string,
		deviceData: Prisma.ProfileDeviceCreateInput,
	) {
		const existing = await this.findByDeviceId(deviceData.deviceId);

		if (existing) {
			return prisma.profileDevice.update({
				where: { deviceId: deviceData.deviceId },
				data: {
					lastSeen: new Date(),
					lastIp: deviceData.lastIp,
					loginCount: { increment: 1 },
				},
			});
		}

		return prisma.profileDevice.create({
			data: {
				...deviceData,
				profile: { connect: { id: profileId } },
				firstSeen: new Date(),
				lastSeen: new Date(),
			} as any,
		});
	}

	/**
	 * List trusted devices for profile
	 */
	async findTrustedByProfileId(profileId: string) {
		return prisma.profileDevice.findMany({
			where: { profileId, isTrusted: true },
		});
	}
}

export const deviceRepository = new DeviceRepository();

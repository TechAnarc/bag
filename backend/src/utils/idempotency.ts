import { prisma } from "../config/database";
import { logger } from "../config/logger";

export class IdempotencyService {
	/**
	 * Check if a request with this key has already been processed.
	 * Returns the previous result if it exists.
	 */
	static async check(key: string): Promise<any | null> {
		if (!key) return null;

		// Currently we only support idempotency for Orders
		const existingOrder = await (prisma as any).order.findUnique({
			where: { idempotencyKey: key },
			include: {
				items: { include: { product: true } },
				user: true,
			},
		});

		if (existingOrder) {
			logger.info(`♻️  Idempotency hit for key: ${key}`);
			return existingOrder;
		}

		return null;
	}
}

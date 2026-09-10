import * as admin from "firebase-admin";
import { logger } from "./logger";
import { env } from "./env";

try {
	if (!admin.apps.length) {
		// In production, you would use a service account key file or env variable
		// For now, we'll use an environment variable that contains the JSON
		const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
			? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
			: null;

		if (serviceAccount) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			});
			logger.info("🔥 Firebase Admin initialized successfully");
		} else {
			logger.warn(
				"⚠️ Firebase Service Account not found. Push notifications will be simulated.",
			);
		}
	}
} catch (error) {
	logger.error("❌ Failed to initialize Firebase Admin:", error);
}

export const messaging = admin.apps.length ? admin.messaging() : null;

import { Router } from "express";
import profileRoutes from "./profile/profile.routes";
import adminRoutes from "./admin/admin.routes";
import { upisService } from "./upis.service";
import { scoringService } from "./scoring/scoring.service";

/**
 * UPIS Unified Module
 * Initializes intelligence services and registers routes.
 */

import { bootstrapDigitalTwins } from "./bootstrap";
import { upisSocketSubscriber } from "./upis.socket-subscriber";
import { telemetryMonitor } from "./monitoring.service";

// Initialize autonomous intelligence services
const initializeUPIS = () => {
	console.log("🧠 [UPIS]: Activating Digital Twin Engine...");
	upisService; // Trigger constructor and event bus subscriptions
	scoringService;
	upisSocketSubscriber; // Activate WebSocket broadcasts
	telemetryMonitor; // Start heartbeat listeners

	// Run one-time historical data reconciliation asynchronously in the background
	bootstrapDigitalTwins().catch((err) => {
		console.error("❌ [UPIS]: Auto-Bootstrap Failed", err);
	});
};

import { eventBus, DomainEvent } from "../../core/events/event-bus";
import {
	authenticate,
	optionalAuthenticate,
} from "../../middleware/auth.middleware";

const upisRouter = Router();

// Public Behavioral Telemetry
upisRouter.post("/trace", optionalAuthenticate, (req: any, res) => {
	const { event, payload } = req.body;

	// Convert public trace to DomainEvent
	let domainEvent: DomainEvent | null = null;
	switch (event) {
		case "PRODUCT_VIEW":
			domainEvent = DomainEvent.PRODUCT_VIEWED;
			break;
		case "CART_UPDATE":
			domainEvent = DomainEvent.CART_UPDATED;
			break;
		case "CHECKOUT_START":
			domainEvent = DomainEvent.CHECKOUT_STARTED;
			break;
	}

	if (domainEvent) {
		const userId = req.auth?.id || "GUEST";
		eventBus.emitDomainEvent(
			domainEvent,
			{
				...payload,
				userId: userId,
			},
			{ actor: userId },
		);
	}

	res.status(202).json({ success: true, message: "Telemetry received" });
});

// Register Main Routes
upisRouter.use("/profile", profileRoutes);
upisRouter.use("/admin/upis", adminRoutes);

export { upisRouter, initializeUPIS };

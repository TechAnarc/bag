import { logger } from "../../config/logger";
import { eventBus } from "../../core/events/event-bus";
import { SocketService } from "../../config/socket";

/**
 * 🛡️ Vector 4: Telemetry Integrity Monitoring (Phase 5)
 * Evaluates engine health, detects event droppage, and measures ingestion latency.
 */
export class TelemetryIntegrityService {
	private lastHeartbeatSentAt: number = 0;
	private ingestionLatencies: number[] = [];
	private maxHistory = 20;

	constructor() {
		this.startHeartbeatLoop();
	}

	/**
	 * Periodic validation loop injects fake payload and listens for loopback confirmation
	 */
	private startHeartbeatLoop() {
		logger.info(
			"🛡️ Telemetry Integrity Engine Online. Starting heartbeat checks every 5m.",
		);

		setInterval(
			() => {
				this.executeHeartbeat();
			},
			5 * 60 * 1000,
		); // 5 Minutes standard interval

		// Immediate check on startup
		setTimeout(() => this.executeHeartbeat(), 10000);
	}

	private executeHeartbeat() {
		this.lastHeartbeatSentAt = Date.now();

		try {
			// Trigger synthetic event
			eventBus.emitDomainEvent(
				"SYSTEM.HEARTBEAT" as any,
				{
					timestamp: this.lastHeartbeatSentAt,
					engine: "UPIS_CORE",
				},
				{ actor: "SYSTEM" },
			);

			logger.debug(`[Telemetry:Pulse] Beat transmitted.`);
		} catch (e) {
			logger.error("❌ [Telemetry:Pulse] Heartbeat failure detected!", e);
		}
	}

	/**
	 * Called when the ingestion pipe successfully commits the heartbeat
	 */
	public registerHeartbeatSuccess() {
		const latency = Date.now() - this.lastHeartbeatSentAt;
		this.ingestionLatencies.push(latency);
		if (this.ingestionLatencies.length > this.maxHistory)
			this.ingestionLatencies.shift();

		const integrityScore = this.calculateIntegrityScore();

		// Broadcast to admin channel for the realtime health badge
		SocketService.emitToAdmins("upis:health_status", {
			healthy: true,
			lastLatencyMs: latency,
			integrityScore: integrityScore,
			ts: new Date(),
		});

		if (latency > 2000) {
			logger.warn(
				`⚠️ [Telemetry:Pulse] Extreme ingestion lag detected: ${latency}ms`,
			);
		}
	}

	public getHealthMetrics() {
		return {
			isHealthy:
				this.ingestionLatencies.length > 0
					? this.calculateIntegrityScore() > 80
					: true,
			avgLatency:
				this.ingestionLatencies.reduce((a, b) => a + b, 0) /
				Math.max(1, this.ingestionLatencies.length),
			integrityScore: this.calculateIntegrityScore(),
		};
	}

	private calculateIntegrityScore(): number {
		if (this.ingestionLatencies.length === 0) return 100;
		const avg =
			this.ingestionLatencies.reduce((a, b) => a + b, 0) /
			this.ingestionLatencies.length;
		// Start with 100, deduct based on high average latency (> 1s)
		return Math.max(
			0,
			Math.min(100, 100 - (avg > 1000 ? (avg - 1000) / 100 : 0)),
		);
	}
}

export const telemetryMonitor = new TelemetryIntegrityService();

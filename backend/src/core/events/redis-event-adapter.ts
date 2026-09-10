import { createClient, type RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";
import { IEventBus, EventEnvelope } from "./event-bus.interface";
import { DomainEvent } from "./event-bus";
import { logger } from "../../config/logger";
import { env } from "../../config/env";

export class RedisEventAdapter implements IEventBus {
	private pubClient: RedisClientType<any, any, any>;
	private subClient: RedisClientType<any, any, any>;
	private handlers: Map<string, Array<(envelope: EventEnvelope) => void>> =
		new Map();

	constructor() {
		const redisUrl = env.REDIS_URL || "redis://localhost:6379";
		this.pubClient = createClient({ url: redisUrl });
		this.subClient = createClient({ url: redisUrl });

		this.init();
	}

	private async init() {
		try {
			await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
			logger.info("🧠 Redis Event Adapter: Connected to Redis");
		} catch (err) {
			logger.error("❌ Redis Event Adapter: Connection failed", err);
		}
	}

	async publish(
		event: DomainEvent,
		payload: any,
		metadata: Partial<EventEnvelope> = {},
	): Promise<void> {
		const envelope: EventEnvelope = {
			eventId: uuidv4(),
			eventType: event,
			version: "1.0",
			occurredAt: new Date(),
			correlationId: metadata.correlationId || uuidv4(),
			actor: metadata.actor || "SYSTEM",
			tenantId: metadata.tenantId,
			payload,
			...metadata,
		};

		const channel = `events:${event}`;
		await this.pubClient.publish(channel, JSON.stringify(envelope));
		logger.debug(`[EventBus:Redis] Published ${event} to ${channel}`);
	}

	async subscribe(
		event: DomainEvent,
		handler: (envelope: EventEnvelope) => void,
	): Promise<void> {
		const channel = `events:${event}`;

		if (!this.handlers.has(channel)) {
			this.handlers.set(channel, []);

			await this.subClient.subscribe(channel, (message: string) => {
				try {
					const envelope: EventEnvelope = JSON.parse(message);
					envelope.occurredAt = new Date(envelope.occurredAt);
					const channelHandlers = this.handlers.get(channel);
					if (channelHandlers) {
						channelHandlers.forEach((h) => h(envelope));
					}
				} catch (err) {
					logger.error(
						`❌ Redis Event Adapter: Subscribe error on ${channel}`,
						err,
					);
				}
			});
		}

		this.handlers.get(channel)?.push(handler);
		logger.info(`📡 Redis Event Adapter: Subscribed to ${channel}`);
	}
}

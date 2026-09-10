import { DomainEvent } from "./event-bus";

export interface EventEnvelope<T = any> {
	eventId: string;
	eventType: DomainEvent;
	version: string;
	occurredAt: Date;
	correlationId: string;
	causalityId?: string;
	actor: string;
	tenantId?: string;
	payload: T;
}

export interface IEventBus {
	publish(
		event: DomainEvent,
		payload: any,
		metadata?: Partial<EventEnvelope>,
	): Promise<void>;
	subscribe(
		event: DomainEvent,
		handler: (envelope: EventEnvelope) => Promise<void> | void,
	): void;
}

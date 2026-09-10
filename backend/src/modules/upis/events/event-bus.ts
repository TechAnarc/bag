import { EventEmitter } from "events";

/**
 * UPIS Event Bus
 * Lightweight, in-process event emitter for decoupled module communication.
 */
export enum UPIS_EVENTS {
	USER_REGISTERED = "USER_REGISTERED",
	USER_ACTIVITY_RECORDED = "USER_ACTIVITY_RECORDED",
	ORDER_COMPLETED = "ORDER_COMPLETED",
	POINTS_EARNED = "POINTS_EARNED",
	POINTS_REDEEMED = "POINTS_REDEEMED",
	LOGIN_SUCCESS = "LOGIN_SUCCESS",
	LOGIN_FAILED = "LOGIN_FAILED",
	DEVICE_DETECTED = "DEVICE_DETECTED",
	SECURITY_ALERT = "SECURITY_ALERT",
	TIER_CHANGED = "TIER_CHANGED",
	PROFILE_UPDATED = "PROFILE_UPDATED",
	ADDRESS_ADDED = "ADDRESS_ADDED",
}

class UPISEventBus extends EventEmitter {
	private static instance: UPISEventBus;

	private constructor() {
		super();
		this.setMaxListeners(20);
	}

	public static getInstance(): UPISEventBus {
		if (!UPISEventBus.instance) {
			UPISEventBus.instance = new UPISEventBus();
		}
		return UPISEventBus.instance;
	}

	/**
	 * Typed emission to ensure consistency
	 */
	emitEvent(event: UPIS_EVENTS, data: any) {
		console.log(`[UPIS-EVENT]: ${event}`, { timestamp: new Date(), ...data });
		this.emit(event, data);
	}
}

export const upisEventBus = UPISEventBus.getInstance();

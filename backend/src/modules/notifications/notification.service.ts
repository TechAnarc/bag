import { logger } from "../../config/logger";
import { prisma } from "../../config/database";
import { mailService } from "../mail/mail.service";
import { messaging } from "../../config/firebase";

export enum NotificationPlatform {
	EMAIL = "EMAIL",
	SMS = "SMS",
	PUSH = "PUSH",
	WHATSAPP = "WHATSAPP",
}

export class NotificationService {
	async send(data: {
		to: string;
		templateName: string;
		params: Record<string, any>;
		platform: NotificationPlatform;
	}) {
		logger.info(
			`[Notification] Sending ${data.templateName} via ${data.platform} to ${data.to}`,
		);

		// 1. Fetch template
		const template = await prisma.notificationTemplate.findUnique({
			where: { name: data.templateName },
		});

		if (!template || !template.isActive) {
			logger.warn(
				`[Notification] Template ${data.templateName} not found or inactive`,
			);
			return;
		}

		// 2. Interpolate template
		const content = this.interpolate(template.content, data.params);
		const subject = template.subject
			? this.interpolate(template.subject, data.params)
			: undefined;

		// 3. Dispatch based on platform
		if (data.platform === NotificationPlatform.EMAIL) {
			try {
				await mailService.sendMail({
					to: data.to,
					subject: subject || "Notification",
					html: content,
				});
				logger.debug(
					`[Notification] Email dispatched successfully to ${data.to}`,
				);
			} catch (error) {
				logger.error(
					`[Notification] Failed to dispatch email to ${data.to}:`,
					error,
				);
				throw error;
			}
		} else if (data.platform === NotificationPlatform.PUSH) {
			try {
				if (messaging) {
					await messaging.send({
						token: data.to,
						notification: {
							title: subject || "Bombay Bag House Admin Update",
							body: content,
						},
						data: {
							click_action: "FLUTTER_NOTIFICATION_CLICK", // Standard for mobile apps
							template: data.templateName,
							...data.params,
						},
					});
					logger.debug(
						`[Notification] FCM Push dispatched successfully to ${data.to}`,
					);
				} else {
					logger.warn(
						`[Notification] FCM not configured. Simulated push to ${data.to}: ${content.substring(0, 50)}...`,
					);
				}
			} catch (error) {
				logger.error(
					`[Notification] Failed to dispatch FCM push to ${data.to}:`,
					error,
				);
				// Don't throw for push notifications as they are often non-critical or volatile
			}
		} else {
			// Simulation for other platforms for now
			logger.debug(
				`[Notification] Simulation Dispatching ${data.platform}: ${subject || ""} | ${content.substring(0, 100)}...`,
			);
		}

		// Store in DB for history
		try {
			await prisma.adminLog.create({
				data: {
					adminId: "SYSTEM",
					action: "NOTIFICATION_SENT",
					details: {
						to: data.to,
						template: data.templateName,
						platform: data.platform,
						subject: subject,
					},
				} as any,
			});
		} catch (dbError) {
			logger.warn(
				"[Notification] Failed to log notification in AdminLog:",
				dbError,
			);
		}
	}

	private interpolate(text: string, params: Record<string, any>): string {
		return text.replace(/\{\{(.*?)\}\}/g, (_, key) => {
			const keys = key.trim().split(".");
			let val = params;
			for (const k of keys) {
				val = val?.[k];
			}
			return val !== undefined && val !== null ? String(val) : "";
		});
	}
	async notifyAdmins(templateName: string, params: Record<string, any>) {
		try {
			// Find all active admins with FCM tokens
			const admins = await prisma.admin.findMany({
				where: { isActive: true, fcmToken: { not: null } },
				select: { id: true, fcmToken: true },
			});

			const pushPromises = admins.map((admin) =>
				this.send({
					to: admin.fcmToken!,
					templateName,
					params,
					platform: NotificationPlatform.PUSH,
				}),
			);

			await Promise.allSettled(pushPromises);
		} catch (error) {
			logger.error("[Notification] Failed to notify admins:", error);
		}
	}
}

export const notificationService = new NotificationService();

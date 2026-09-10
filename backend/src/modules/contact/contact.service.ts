import { ContactRepository } from "./contact.repository";
import { mailService } from "../mail/mail.service";
import { logger } from "../../config/logger";
import { SocketService } from "../../config/socket";
import { eventBus, DomainEvent } from "../../core/events/event-bus";

export class ContactService {
	private contactRepo = new ContactRepository();

	async submitContactForm(data: {
		name: string;
		email: string;
		phone?: string;
		subject?: string;
		message: string;
	}) {
		// Validate data
		if (!data.name || !data.email || !data.message) {
			throw new Error("Name, email, and message are required");
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			throw new Error("Invalid email address");
		}

		const submission = await this.contactRepo.createSubmission(data);

		// Emit events
		SocketService.emitToAdmins("contact:new", submission);
		eventBus.emitDomainEvent(DomainEvent.INQUIRY_SUBMITTED, submission);

		// Send email notification (don't await to avoid blocking response)
		mailService.sendContactNotification(data).catch((err) => {
			logger.error("[ContactService] Failed to send email notification:", err);
		});

		return submission;
	}

	async getAllSubmissions(filters?: any) {
		return this.contactRepo.getAllSubmissions(filters);
	}

	async markAsRead(id: string) {
		return this.contactRepo.markAsRead(id);
	}

	async sendReply(id: string, replyText: string, attachments: any[], repliedBy?: string) {
		const submission = await this.contactRepo.getSubmissionById(id);
		if (!submission) {
			throw new Error("Inquiry submission not found");
		}

		const subject = `Re: ${submission.subject || "Your Inquiry to Bombay Bag House"}`;

		// Create a nice HTML template for the email reply
		const html = `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
				<div style="background: #1a1a2e; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; color: #ffd700;">
					<h2 style="margin: 0; font-family: serif;">Bombay Bag House</h2>
				</div>
				<div style="padding: 20px;">
					<p>Namaste <strong>${submission.name}</strong>,</p>
					<p style="white-space: pre-wrap; font-size: 15px; color: #333; line-height: 1.6;">${replyText}</p>
				</div>
				<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
				<div style="background: #f9f9f9; padding: 15px; border-radius: 5px; font-size: 13px; color: #666;">
					<p style="margin-top: 0; font-weight: bold;">Original Inquiry Details:</p>
					<p><strong>Subject:</strong> ${submission.subject || "No Subject"}</p>
					<p><strong>Message:</strong> ${submission.message}</p>
				</div>
				<p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">Bombay Bag House Platform</p>
			</div>
		`;

		const mailInfo = await mailService.sendMail({
			to: submission.email,
			subject,
			html,
			text: `Namaste ${submission.name},\n\n${replyText}\n\n---\nOriginal Message:\n${submission.message}`,
			attachments,
		});

		if (!mailInfo) {
			throw new Error("SMTP Mail Service is not configured or failed to initialize. Please check server logs and environment configuration.");
		}

		// Update database with the reply information
		const updatedSubmission = await this.contactRepo.saveReply(id, replyText, repliedBy);

		// Emit socket event to notify other admins that it has been read/updated
		SocketService.emitToAdmins("contact:read", updatedSubmission);

		return updatedSubmission;
	}
}

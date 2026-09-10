import type { Request, Response } from "express";
import { ContactService } from "./contact.service";
import { sendSuccess, sendError } from "../../utils/response";

const contactService = new ContactService();

export class ContactController {
	async submitForm(req: Request, res: Response) {
		try {
			const { name, email, phone, subject, message } = req.body;

			const submission = await contactService.submitContactForm({
				name,
				email,
				phone,
				subject,
				message,
			});

			return sendSuccess(
				res,
				"Thank you for contacting us! We will get back to you soon.",
				submission,
				201,
			);
		} catch (error: any) {
			console.error("Contact form error:", error);
			return sendError(res, error.message || "Failed to submit contact form");
		}
	}

	async getAllSubmissions(req: Request, res: Response) {
		try {
			const { isRead, isReplied, limit, offset } = req.query;

			const filters = {
				isRead:
					isRead === "true" ? true : isRead === "false" ? false : undefined,
				isReplied:
					isReplied === "true" ? true : isReplied === "false" ? false : undefined,
				limit: limit ? parseInt(limit as string) : undefined,
				offset: offset ? parseInt(offset as string) : undefined,
			};

			const submissions = await contactService.getAllSubmissions(filters);
			return sendSuccess(
				res,
				"Submissions retrieved successfully",
				submissions,
			);
		} catch (error) {
			console.error("Get submissions error:", error);
			return sendError(res, "Failed to retrieve submissions");
		}
	}

	async markAsRead(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const submission = await contactService.markAsRead(id as string);
			return sendSuccess(res, "Submission marked as read", submission);
		} catch (error) {
			console.error("Mark as read error:", error);
			return sendError(res, "Failed to mark submission as read");
		}
	}

	async sendReply(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { message } = req.body;
			const repliedBy = req.admin?.email || "Admin";

			if (!message) {
				return sendError(res, "Reply message is required", 400);
			}

			const files = (req.files as Express.Multer.File[]) || [];
			const attachments = files.map((file) => ({
				filename: file.originalname,
				content: file.buffer,
				contentType: file.mimetype,
			}));

			const submission = await contactService.sendReply(
				id as string,
				message,
				attachments,
				repliedBy,
			);
			return sendSuccess(res, "Reply sent successfully", submission);
		} catch (error: any) {
			console.error("Send reply error:", error);
			return sendError(res, error.message || "Failed to send reply");
		}
	}
}

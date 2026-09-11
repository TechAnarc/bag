import nodemailer from "nodemailer";
import { logger } from "../../config/logger";

export class MailService {
	private transporter: nodemailer.Transporter;
	private isConfigured: boolean = false;
	private defaultFrom: string = "";

	constructor() {
		const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

		if (!hasSmtpConfig) {
			logger.warn(
				"[Mail] SMTP credentials not configured. Email features will be disabled.",
			);
			// Create a dummy transporter to prevent null reference errors
			this.transporter = nodemailer.createTransport({
				host: "localhost",
				port: 587,
				secure: false,
			});
			return;
		}

		this.isConfigured = true;
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "smtp.gmail.com",
			port: parseInt(process.env.SMTP_PORT || "587"),
			secure: process.env.SMTP_SECURE === "true",
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});

		this.defaultFrom = `"${process.env.SMTP_FROM_NAME || "Bombay Bag House"}" <${process.env.SMTP_FROM_EMAIL || "support@bombaybaghouse.com"}>`;

		// Verify connection on startup only if configured (Non-blocking, Warn-only)
		this.transporter.verify((error) => {
			if (error) {
				logger.warn(
					`[Mail] SMTP Connection warning: ${error.message || error}`,
				);
				this.isConfigured = false;
			} else {
				logger.info("[Mail] SMTP Server is ready");
			}
		});
	}

	async sendMail(options: {
		to: string;
		subject: string;
		text?: string;
		html?: string;
		attachments?: Array<{
			filename: string;
			content: any;
			contentType?: string;
		}>;
	}) {
		if (!this.isConfigured) {
			logger.warn(
				"[Mail] Email not sent - SMTP not configured:",
				options.subject,
			);
			return null;
		}

		try {
			const info = await this.transporter.sendMail({
				from: `"${process.env.SMTP_FROM_NAME || "Triveni Jewellers"}" <${process.env.SMTP_FROM_EMAIL || "triveni1gram@gmail.com"}>`,
				to: options.to,
				subject: options.subject,
				text: options.text,
				html: options.html,
				attachments: options.attachments,
			});

			logger.info(`[Mail] Message sent: ${info.messageId}`);
			return info;
		} catch (error) {
			logger.error("[Mail] Send Error:", error);
			throw error;
		}
	}

	async sendContactNotification(data: {
		name: string;
		email: string;
		phone?: string;
		subject?: string;
		message: string;
	}) {
		const adminEmail =
			process.env.ADMIN_RECIPIENT_EMAIL || "triveni1gram@gmail.com";

		const html = `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
				<h2 style="color: #4b0082; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">New Contact Inquiry</h2>
				<p>A new message has been received from the website contact form:</p>
				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background: #f9f9f9; width: 30%;">Name</td>
						<td style="padding: 10px; border: 1px solid #eee;">${data.name}</td>
					</tr>
					<tr>
						<td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background: #f9f9f9;">Email</td>
						<td style="padding: 10px; border: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td>
					</tr>
					<tr>
						<td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background: #f9f9f9;">Phone</td>
						<td style="padding: 10px; border: 1px solid #eee;">${data.phone || "N/A"}</td>
					</tr>
					<tr>
						<td style="padding: 10px; border: 1px solid #eee; font-weight: bold; background: #f9f9f9;">Subject</td>
						<td style="padding: 10px; border: 1px solid #eee;">${data.subject || "No Subject"}</td>
					</tr>
				</table>
				<div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
					<h3 style="margin-top: 0;">Message:</h3>
					<p style="white-space: pre-wrap;">${data.message}</p>
				</div>
				<p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">Sent from Bombay Bag House Platform</p>
			</div>
		`;

		return this.sendMail({
			to: adminEmail,
			subject: `🚨 New Contact: ${data.subject || data.name}`,
			html,
			text: `New contact from ${data.name} (${data.email}): ${data.message}`,
		});
	}

	async sendOrderConfirmation(order: any, customerEmail: string) {
		const orderLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/order-tracking/${order.id}`;
		const html = `
			<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
				<div style="background: #1a1a2e; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
					<h1 style="color: #ffd700; margin: 0; font-family: serif;">Bombay Bag House</h1>
					<p style="color: #a0a0a0; margin: 5px 0 0;">Luxury Handbags & Accessories</p>
				</div>
				
				<div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
					<h2 style="color: #4b0082; margin-top: 0;">Order Received ✨</h2>
					<p>Namaste <strong>${order.user?.name || "Customer"}</strong>,</p>
					<p>Thank you for shopping with us! We have successfully received your order <strong>#${order.orderNumber || order.id}</strong>. We are currently processing it.</p>
					
					<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
						<h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Order Summary</h3>
						<table style="width: 100%; border-collapse: collapse;">
							<tr>
								<td style="padding: 8px 0; color: #666;">Total Amount</td>
								<td style="padding: 8px 0; text-align: right; font-weight: bold;">₹${order.total}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #666;">Payment Method</td>
								<td style="padding: 8px 0; text-align: right;">${order.paymentMethod}</td>
							</tr>
							<tr>
								<td style="padding: 8px 0; color: #666;">Expected Delivery</td>
								<td style="padding: 8px 0; text-align: right;">Within 5-7 Business Days</td>
							</tr>
						</table>
					</div>

					<div style="text-align: center; margin-top: 30px;">
						<a href="${orderLink}" style="background: linear-gradient(to right, #4b0082, #6a0dad); color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">Track Order Status</a>
					</div>
					
					<p style="text-align: center; margin-top: 20px; font-size: 13px; color: #888;">
						You can track the live progress of your order by clicking the button above.
					</p>
				</div>
				
				<div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
					<p>&copy; ${new Date().getFullYear()} Bombay Bag House. All rights reserved.</p>
				</div>
			</div>
		`;

		return this.sendMail({
			to: customerEmail,
			subject: `🎉 Order Confirmation - #${order.orderNumber || order.id}`,
			html,
		});
	}

	async sendInvoice(order: any, customerEmail: string) {
		const orderLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/order-tracking/${order.id}`;
		const html = `
			<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
				<div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-bottom: none; border-radius: 10px 10px 0 0;">
					<div style="display: flex; justify-content: space-between; align-items: center;">
						<div>
							<h2 style="color: #4b0082; margin: 0; font-family: serif;">INVOICE</h2>
							<p style="color: #666; margin: 5px 0 0;">#INV-${order.orderNumber}</p>
						</div>
						<div style="text-align: right;">
							<h3 style="margin: 0; color: #ffd700;">PAID</h3>
							<p style="margin: 5px 0 0; font-size: 12px;">${new Date().toLocaleDateString()}</p>
						</div>
					</div>
				</div>
				
				<div style="padding: 30px; border: 1px solid #e9ecef; border-top: 2px solid #4b0082; border-radius: 0 0 10px 10px;">
					<p>Dear <strong>${order.user?.name || "Customer"}</strong>,</p>
					<p>Thank you for your payment. Here is the invoice for your recent order.</p>
					
					<div style="margin: 25px 0;">
						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr style="background: #f8f9fa;">
									<th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
									<th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Qty</th>
									<th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
								</tr>
							</thead>
							<tbody>
								${order.items
									.map(
										(item: any) => `
									<tr>
										<td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
											<div style="font-weight: bold;">${item.product?.name || "Product"}</div>
											<div style="font-size: 12px; color: #888;">ID: ${item.productId}</div>
										</td>
										<td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
										<td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${item.price}</td>
									</tr>
								`,
									)
									.join("")}
							</tbody>
							<tfoot>
								<tr>
									<td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Subtotal</td>
									<td style="padding: 12px; text-align: right;">₹${order.subtotal}</td>
								</tr>
								<tr>
									<td colspan="2" style="padding: 12px; text-align: right; color: #666;">Tax (3%)</td>
									<td style="padding: 12px; text-align: right;">₹${order.tax}</td>
								</tr>
								${
									order.shippingCharge > 0
										? `
								<tr>
									<td colspan="2" style="padding: 12px; text-align: right; color: #666;">Shipping</td>
									<td style="padding: 12px; text-align: right;">₹${order.shippingCharge}</td>
								</tr>`
										: ""
								}
								<tr style="font-size: 16px;">
									<td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #4b0082;">Total Paid</td>
									<td style="padding: 15px; text-align: right; font-weight: bold; color: #4b0082;">₹${order.total}</td>
								</tr>
							</tfoot>
						</table>
					</div>

					<div style="background: #e8f4fd; padding: 15px; border-radius: 5px; color: #0c5460; font-size: 14px; text-align: center;">
						You can track this order in real-time on your dashboard.
						<br/>
						<a href="${orderLink}" style="color: #0c5460; font-weight: bold; text-decoration: underline;">Track Order</a>
					</div>
				</div>

				<div style="text-align: center; margin-top: 30px; font-size: 11px; color: #aaa;">
					<p>Bombay Bag House | GSTIN: XXXXXXXXXX</p>
					<p>This is a computer-generated invoice.</p>
				</div>
			</div>
		`;

		return this.sendMail({
			to: customerEmail,
			subject: `🧾 Invoice for Order #${order.orderNumber}`,
			html,
		});
	}

	async sendOTPMail(
		to: string,
		otp: string,
		userName: string = "Valued Customer",
	) {
		const html = `
			<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
				<div style="background: #1a1a2e; padding: 25px; text-align: center;">
					<h1 style="color: #ffd700; margin: 0; font-family: serif;">Bombay Bag House</h1>
				</div>
				<div style="padding: 30px; text-align: center; background: #fff;">
					<h2 style="color: #4b0082; margin-top: 0;">Verification Code</h2>
					<p>Namaste ${userName},</p>
					<p>Use the following 6-digit code to verify your account. This code is valid for 5 minutes.</p>
					<div style="margin: 30px 0;">
						<span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e; background: #f4f4f9; padding: 15px 30px; border-radius: 8px; border: 1px dashed #4b0082;">${otp}</span>
					</div>
					<p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
				</div>
				<div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888;">
					<p>&copy; ${new Date().getFullYear()} Bombay Bag House. <br/> Safety First: We never ask for your password or OTP via call or text.</p>
				</div>
			</div>
		`;

		return this.sendMail({
			to,
			subject: `🔐 ${otp} is your verification code`,
			html,
			text: `Your verification code is ${otp}. Valid for 5 minutes.`,
		});
	}
}

export const mailService = new MailService();

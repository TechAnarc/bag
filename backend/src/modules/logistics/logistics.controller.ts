import { Request, Response } from "express";
import { prisma } from "../../config/database";
import { sendSuccess, sendError } from "../../utils/response";
import { logger } from "../../config/logger";
import { logisticsService } from "./logistics.service";

export class LogisticsController {
	/**
	 * List all 15+ delivery partners
	 */
	async getPartners(req: Request, res: Response) {
		try {
			const partners = await (prisma as any).logisticsPartner.findMany({
				orderBy: { reliabilityScore: "desc" },
			});
			return sendSuccess(res, "Logistics partner network retrieved.", partners);
		} catch (error: any) {
			return sendError(res, "Failed to retrieve logistics partners.");
		}
	}

	/**
	 * Get partner specific performance metrics
	 */
	async getPartnerPerformance(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const partner = await (prisma as any).logisticsPartner.findUnique({
				where: { id },
				include: {
					shipments: {
						take: 10,
						orderBy: { manifestedAt: "desc" },
					},
				},
			});

			if (!partner) return sendError(res, "Partner not found.", 404);

			return sendSuccess(
				res,
				`Performance metrics for ${partner.name}.`,
				partner,
			);
		} catch (error: any) {
			return sendError(res, "Failed to retrieve performance metrics.");
		}
	}

	/**
	 * Register/Connect New Logistics Partner
	 */
	async createPartner(req: Request, res: Response) {
		try {
			const { name, code, type, capabilities, apiKey, apiSecret, apiUrl } =
				req.body;

			const partner = await (prisma as any).logisticsPartner.create({
				data: {
					name,
					code,
					type,
					capabilities: capabilities || {},
					apiKey,
					apiSecret,
					apiUrl,
					reliabilityScore: 1.0, // New partners start with perfect score
				},
			});

			return sendSuccess(
				res,
				"New logistics partner integrated successfully.",
				partner,
				201,
			);
		} catch (error: any) {
			logger.error("[LogisticsController] Partner Integration Error", error);
			return sendError(res, "Failed to integrate logistics partner.");
		}
	}

	/**
	 * Manifest Shipment (Autonomous or Manual)
	 */
	async manifestShipment(req: Request, res: Response) {
		try {
			const { orderId, partnerId } = req.body;

			const shipment = await logisticsService.manifestShipment(
				orderId,
				partnerId,
			);

			// Update Order status
			await prisma.order.update({
				where: { id: orderId },
				data: { status: "SHIPPED" },
			});

			return sendSuccess(
				res,
				"Shipment manifested with selected partner.",
				shipment,
				201,
			);
		} catch (error: any) {
			logger.error("[LogisticsController] Manifest Error", error);
			return sendError(res, "Failed to manifest shipment.");
		}
	}
}

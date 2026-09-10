/**
 * Invoice Routes
 * API routes for invoice operations
 */

import { Router } from "express";
import * as invoiceController from "./invoice.controller";
// import { authenticate } from '../../middleware/auth.middleware'; // Uncomment when auth middleware is ready

const router = Router();

/**
 * @route   POST /api/v1/invoices/generate
 * @desc    Generate invoice for an order
 * @access  Private (Admin/User)
 */
router.post("/generate", invoiceController.generateInvoice);

/**
 * @route   GET /api/v1/invoices
 * @desc    List invoices with filters
 * @access  Private (Admin)
 */
router.get("/", invoiceController.listInvoices);

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get("/:id", invoiceController.getInvoiceById);

/**
 * @route   GET /api/v1/invoices/:id/download
 * @desc    Download invoice PDF
 * @access  Private
 */
router.get("/:id/download", invoiceController.downloadInvoice);

/**
 * @route   GET /api/v1/invoices/order/:orderId
 * @desc    Get invoice by order ID
 * @access  Private
 */
router.get("/order/:orderId", invoiceController.getInvoiceByOrderId);

/**
 * @route   GET /api/v1/invoices/verify/:hash
 * @desc    Verify invoice authenticity
 * @access  Public
 */
router.get("/verify/:hash", invoiceController.verifyInvoice);

/**
 * @route   POST /api/v1/invoices/:id/regenerate
 * @desc    Regenerate invoice PDF
 * @access  Private (Admin)
 */
router.post("/:id/regenerate", invoiceController.regenerateInvoice);

export default router;

import type { Request, Response } from "express";
import { CartService } from "./cart.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../middleware/auth.middleware";

const cartService = new CartService();

export class CartController {
	async getCart(req: AuthRequest, res: Response) {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "Unauthorized", 401);
			}

			const cart = await cartService.getUserCart(userId);
			return sendSuccess(res, "Cart retrieved successfully", cart);
		} catch (error) {
			console.error("Get cart error:", error);
			return sendError(res, "Failed to retrieve cart");
		}
	}

	async addItem(req: AuthRequest, res: Response) {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "Unauthorized", 401);
			}

			const { productId, quantity = 1 } = req.body;

			if (!productId) {
				return sendError(res, "Product ID is required", 400);
			}

			const cartItem = await cartService.addItemToCart(
				userId,
				productId,
				quantity,
			);
			return sendSuccess(res, "Item added to cart", cartItem, 201);
		} catch (error) {
			console.error("Add to cart error:", error);
			return sendError(res, "Failed to add item to cart");
		}
	}

	async updateItem(req: AuthRequest, res: Response) {
		try {
			const userId = req.auth?.id;
			if (!userId) return sendError(res, "Unauthorized", 401);

			const { id } = req.params;
			const { quantity } = req.body;

			if (!quantity || quantity <= 0) {
				return sendError(res, "Valid quantity is required", 400);
			}

			// Verify ownership implicitly through service/repo if we had that check
			// For now, let's at least fix the auth object and property
			const cartItem = await cartService.updateCartItemQuantity(
				id as string,
				quantity,
			);
			return sendSuccess(res, "Cart item updated", cartItem);
		} catch (error) {
			console.error("Update cart item error:", error);
			return sendError(res, "Failed to update cart item");
		}
	}

	async removeItem(req: AuthRequest, res: Response) {
		try {
			const userId = req.auth?.id;
			if (!userId) return sendError(res, "Unauthorized", 401);

			const { id } = req.params;
			await cartService.removeItemFromCart(id as string);
			return sendSuccess(res, "Item removed from cart", null);
		} catch (error) {
			console.error("Remove cart item error:", error);
			return sendError(res, "Failed to remove cart item");
		}
	}

	async clearCart(req: AuthRequest, res: Response) {
		try {
			const userId = req.auth?.id;
			if (!userId) {
				return sendError(res, "Unauthorized", 401);
			}

			await cartService.clearUserCart(userId);
			return sendSuccess(res, "Cart cleared successfully", null);
		} catch (error) {
			console.error("Clear cart error:", error);
			return sendError(res, "Failed to clear cart");
		}
	}

	async calculateTotals(req: Request, res: Response) {
		try {
			const { items, deliveryMethod } = req.body;
			if (!items || !Array.isArray(items)) {
				return sendError(res, "Items array is required", 400);
			}

			const totals = cartService.calculateTotals(items, deliveryMethod);
			return sendSuccess(res, "Totals calculated successfully", totals);
		} catch (error) {
			console.error("Calculate totals error:", error);
			return sendError(res, "Failed to calculate totals");
		}
	}
}

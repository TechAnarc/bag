import { prisma } from '../../config/database';
import { PrismaClient, CartItem, Prisma } from "@prisma/client";



export class CartRepository {
	async getCartByUserId(userId: string) {
		return prisma.cartItem.findMany({
			where: { userId },
			include: {
				product: {
					select: {
						id: true,
						name: true,
						slug: true,
						price: true,
						discountPrice: true,
						images: true,
						thumbnail: true,
						inventory: true,
						isActive: true,
						basePrice: true,
						sellingPrice: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async addToCart(userId: string, productId: string, quantity: number = 1) {
		// Check if item already exists
		const existing = await prisma.cartItem.findUnique({
			where: {
				userId_productId: { userId, productId },
			},
		});

		if (existing) {
			// Update quantity
			return prisma.cartItem.update({
				where: { id: existing.id },
				data: { quantity: existing.quantity + quantity },
				include: { product: true },
			});
		}

		// Create new cart item
		return prisma.cartItem.create({
			data: { userId, productId, quantity },
			include: { product: true },
		});
	}

	async updateCartItem(cartItemId: string, quantity: number) {
		return prisma.cartItem.update({
			where: { id: cartItemId },
			data: { quantity },
			include: { product: true },
		});
	}

	async removeFromCart(cartItemId: string) {
		return prisma.cartItem.delete({
			where: { id: cartItemId },
		});
	}

	async clearCart(userId: string) {
		return prisma.cartItem.deleteMany({
			where: { userId },
		});
	}

	async getCartItemCount(userId: string): Promise<number> {
		return prisma.cartItem.count({
			where: { userId },
		});
	}
}

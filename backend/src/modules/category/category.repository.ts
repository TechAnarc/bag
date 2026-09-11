import { prisma } from '../../config/database';
import { PrismaClient, Category, Prisma } from "@prisma/client";



export class CategoryRepository {
	async findAll(where: Prisma.CategoryWhereInput = {}): Promise<any[]> {
		return (prisma.category as any).findMany({
			where,
			include: {
				_count: {
					select: { products: true },
				},
			},
			orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
		});
	}

	async reorder(items: { id: string; sortOrder: number }[]): Promise<void> {
		await prisma.$transaction(
			items.map((item) =>
				prisma.category.update({
					where: { id: item.id },
					data: { sortOrder: item.sortOrder },
				}),
			),
		);
	}

	async findById(id: string): Promise<Category | null> {
		return prisma.category.findUnique({
			where: { id },
		});
	}

	async findBySlug(slug: string): Promise<Category | null> {
		return prisma.category.findUnique({
			where: { slug },
		});
	}

	async create(data: Prisma.CategoryCreateInput): Promise<Category> {
		return prisma.category.create({ data });
	}

	async update(
		id: string,
		data: Prisma.CategoryUpdateInput,
	): Promise<Category> {
		return prisma.category.update({
			where: { id },
			data,
		});
	}

	async delete(id: string): Promise<Category> {
		return prisma.category.delete({
			where: { id },
		});
	}

	async countProducts(id: string): Promise<number> {
		const result = await prisma.product.count({
			where: { categoryId: id },
		});
		return result;
	}
}

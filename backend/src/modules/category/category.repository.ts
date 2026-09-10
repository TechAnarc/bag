import { PrismaClient, Category, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export class CategoryRepository {
	async findAll(where: Prisma.CategoryWhereInput = {}): Promise<Category[]> {
		return prisma.category.findMany({
			where,
			orderBy: { sortOrder: "asc" },
		});
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

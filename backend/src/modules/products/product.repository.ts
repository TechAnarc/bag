import { prisma } from "../../config/database";
import { Product, Prisma, ProductStatus } from "@prisma/client";

export class ProductRepository {
	async findAll(params: {
		where?: Prisma.ProductWhereInput;
		orderBy?: Prisma.ProductOrderByWithRelationInput;
		skip?: number;
		take?: number;
		include?: Prisma.ProductInclude;
	}): Promise<Product[]> {
		return prisma.product.findMany({
			where: params.where,
			orderBy: params.orderBy || { createdAt: "desc" },
			skip: params.skip,
			take: params.take,
			include: params.include || { category: true },
		});
	}

	async findById(id: string): Promise<Product | null> {
		const product = await prisma.product.findUnique({
			where: { id },
			include: { category: true, reviews: true },
		});

		if (product) {
			console.log(
				`[DB] 📦 Fetched product ${id}: ${product.name} (SKU: ${product.sku})`,
			);
			// Log specific fields to check for nulls/omissions
			const jsonFields = {
				specifications: !!product.specifications,
				inventory: !!product.inventory,
				images: product.images?.length || 0,
			};
			console.log(`[DB] 🧩 JSON Data check:`, jsonFields);
		} else {
			console.log(`[DB] ❌ Product ${id} not found`);
		}

		return product;
	}

	async findBySlug(slug: string): Promise<Product | null> {
		return prisma.product.findUnique({
			where: { slug },
			include: { category: true, reviews: true },
		});
	}

	async findBySku(sku: string): Promise<Product | null> {
		return prisma.product.findUnique({
			where: { sku },
			include: { category: true },
		});
	}

	async create(data: Prisma.ProductCreateInput): Promise<Product> {
		return prisma.product.create({ data, include: { category: true } });
	}

	async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
		return prisma.product.update({
			where: { id },
			data,
			include: { category: true },
		});
	}

	async delete(id: string): Promise<Product> {
		return prisma.product.delete({
			where: { id },
		});
	}

	async count(where: Prisma.ProductWhereInput = {}): Promise<number> {
		return prisma.product.count({ where });
	}

	async createMany(
		data: Prisma.ProductCreateManyInput[],
	): Promise<Prisma.BatchPayload> {
		return prisma.product.createMany({ data });
	}
}

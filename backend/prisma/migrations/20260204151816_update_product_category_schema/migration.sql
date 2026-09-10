/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stockQuantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `subCategory` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Product` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropIndex
DROP INDEX "Product_category_idx";

-- DropIndex
DROP INDEX "Product_isFeatured_idx";

-- DropIndex
DROP INDEX "Product_isTrending_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "material",
DROP COLUMN "stockQuantity",
DROP COLUMN "subCategory",
DROP COLUMN "weight",
ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY['Fine Precious Metals', 'Handmade in India', 'Everyday Luxury', 'Insured Shipping']::TEXT[],
ADD COLUMN     "careInstructions" TEXT DEFAULT 'After each use, gently wipe your jewelry with a soft cloth. Store in a cool, dry place away from direct sunlight. Avoid immersing your jewelry in water. Refrain from cleaning with soap or harsh chemicals.',
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "gstIncluded" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "inventory" JSONB,
ADD COLUMN     "platingType" TEXT,
ADD COLUMN     "seo" JSONB,
ADD COLUMN     "shortTagline" TEXT,
ADD COLUMN     "specifications" JSONB,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

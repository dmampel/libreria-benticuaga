-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "searchName" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "searchName" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "searchDescription" TEXT,
ADD COLUMN     "searchName" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Brand_searchName_idx" ON "Brand"("searchName");

-- CreateIndex
CREATE INDEX "Category_searchName_idx" ON "Category"("searchName");

-- CreateIndex
CREATE INDEX "Product_searchName_idx" ON "Product"("searchName");

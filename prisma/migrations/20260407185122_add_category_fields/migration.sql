-- AlterTable
ALTER TABLE "Category" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '',
ADD COLUMN "icon" TEXT;

-- Make slug unique (after backfilling, but table is likely empty in dev)
ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_key" UNIQUE ("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

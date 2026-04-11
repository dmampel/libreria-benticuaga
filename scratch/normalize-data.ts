/**
 * One-time script to normalize existing Products, Brands, and Categories.
 * Run this AFTER the Prisma migration is applied.
 * 
 * Usage: npx tsx scratch/normalize-data.ts (or equivalent)
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function normalizeText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

async function main() {
  console.log("🚀 Starting data normalization...")

  // 1. Categories
  const categories = await prisma.category.findMany()
  console.log(`- Normalizing ${categories.length} categories...`)
  for (const c of categories) {
    await prisma.category.update({
      where: { id: c.id },
      data: { searchName: normalizeText(c.name) },
    })
  }

  // 2. Brands
  const brands = await prisma.brand.findMany()
  console.log(`- Normalizing ${brands.length} brands...`)
  for (const b of brands) {
    await prisma.brand.update({
      where: { id: b.id },
      data: { searchName: normalizeText(b.name) },
    })
  }

  // 3. Products
  const products = await prisma.product.findMany()
  console.log(`- Normalizing ${products.length} products...`)
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        searchName: normalizeText(p.name),
        searchDescription: normalizeText(p.description),
      },
    })
  }

  console.log("✅ Normalization complete!")
}

main()
  .catch((e) => {
    console.error("❌ Error during normalization:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

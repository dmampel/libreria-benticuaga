import { prisma } from "@/lib/prisma"

export interface BrandData {
  id: string
  name: string
  image: string | null
}

/**
 * Fetches all brands ordered alphabetically.
 * Safe to call from Server Components — returns [] on error, never throws.
 */
export async function getAllBrands(): Promise<BrandData[]> {
  try {
    return await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, image: true },
    })
  } catch (error) {
    console.error("[Brands] Error fetching brands:", error)
    return []
  }
}

import { prisma } from "@/lib/prisma"

export interface BrandData {
  id: string
  name: string
  image: string | null
}

export const BRAND_COLORS = [
  "bg-pink-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-orange-500",
]

export function getBrandColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return BRAND_COLORS[Math.abs(hash) % BRAND_COLORS.length]
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

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeText } from "@/lib/utils/normalize"

const EMPTY = { products: [], brands: [], categories: [] }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const qRaw = (searchParams.get("q") ?? "").trim()

  // Guard: too short or empty
  if (qRaw.length < 2) {
    return NextResponse.json({ success: true, data: EMPTY })
  }

  const q = normalizeText(qRaw)

  try {
    const [products, brands, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { searchName: { contains: q, mode: "insensitive" } },
            { searchDescription: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          retailPrice: true,
          image: true,
          brand: { select: { name: true } },
        },
        take: 5,
        orderBy: { name: "asc" },
      }),

      prisma.brand.findMany({
        where: { searchName: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, image: true },
        take: 5,
        orderBy: { name: "asc" },
      }),

      prisma.category.findMany({
        where: { searchName: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, slug: true },
        take: 5,
        orderBy: { name: "asc" },
      }),
    ])

    return NextResponse.json({ success: true, data: { products, brands, categories } })
  } catch (error) {
    console.error("[Search] Query error:", error)
    return NextResponse.json({ success: true, data: EMPTY })
  }
}

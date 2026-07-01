import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireN8nAuth } from "@/lib/n8n-auth"

export async function GET(request: NextRequest) {
  if (!requireN8nAuth(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const search = request.nextUrl.searchParams.get("search") ?? ""
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50")

    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { category: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        retailPrice: true,
        stock: true,
        description: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.retailPrice,
          stock: p.stock,
          description: p.description ?? "",
          category: p.category?.name ?? "",
        })),
        total: products.length,
      },
    })
  } catch (error) {
    console.error("[N8N] Products error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

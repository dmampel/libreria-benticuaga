import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token || !requireAdmin(token).authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const [outOfStock, lowStock, topProducts, leastOrderedGrouped, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: { stock: 0 },
        select: { id: true, name: true, stock: true, category: { select: { name: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { stock: { gt: 0, lte: 50 } },
        select: { id: true, name: true, stock: true, category: { select: { name: true } } },
        orderBy: { stock: "asc" },
        take: 20,
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "asc" } },
        take: 10,
      }),
      prisma.product.count(),
    ])

    const zeroSales = await prisma.product.findMany({
      where: { orderItems: { none: {} } },
      select: { id: true, name: true, stock: true, category: { select: { name: true } } },
      take: 10,
    })

    // Enrich top/least with product info
    const topProductIds = topProducts.map((p) => p.productId)
    const leastProductIds = leastOrderedGrouped.map((p) => p.productId)
    const allIds = [...new Set([...topProductIds, ...leastProductIds])]

    const productMap = await prisma.product.findMany({
      where: { id: { in: allIds } },
      select: { id: true, name: true, stock: true, retailPrice: true, category: { select: { name: true } } },
    })
    const byId = Object.fromEntries(productMap.map((p) => [p.id, p]))

    const topEnriched = topProducts.map((t) => ({
      productId: t.productId,
      name: byId[t.productId]?.name ?? t.productId,
      stock: byId[t.productId]?.stock ?? 0,
      category: byId[t.productId]?.category?.name ?? null,
      totalSold: t._sum.quantity ?? 0,
      orderCount: t._count.id,
    }))

    const leastEnriched = [
      ...zeroSales.map(z => ({
        productId: z.id,
        name: z.name,
        stock: z.stock,
        category: z.category?.name ?? null,
        totalSold: 0
      })),
      ...leastOrderedGrouped
        .filter(t => !zeroSales.some(z => z.id === t.productId)) // Exclude overlaps logic just in case
        .map((t) => ({
          productId: t.productId,
          name: byId[t.productId]?.name ?? t.productId,
          stock: byId[t.productId]?.stock ?? 0,
          category: byId[t.productId]?.category?.name ?? null,
          totalSold: t._sum.quantity ?? 0,
        }))
    ].slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        outOfStock,
        lowStock,
        topProducts: topEnriched,
        leastOrdered: leastEnriched,
        summary: {
          totalProducts,
          outOfStockCount: outOfStock.length,
          lowStockCount: lowStock.length,
        },
      },
    })
  } catch (error) {
    console.error("[Admin] Inventory stats error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

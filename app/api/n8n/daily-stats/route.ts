import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireN8nAuth } from "@/lib/n8n-auth"

export async function GET(request: NextRequest) {
  if (!requireN8nAuth(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const lowStockThreshold = Number(request.nextUrl.searchParams.get("lowStockThreshold") ?? "5")

    const now = new Date()
    // Argentina time offset: UTC-3
    const argOffset = -3 * 60 * 60 * 1000
    const todayArg = new Date(now.getTime() + argOffset)
    const startOfTodayArg = new Date(
      Date.UTC(todayArg.getUTCFullYear(), todayArg.getUTCMonth(), todayArg.getUTCDate())
    )
    const startOfToday = new Date(startOfTodayArg.getTime() - argOffset)

    const [todayOrders, pendingOrders, preparingOrders, lowStockProducts] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: "CANCELLED" },
        },
        select: { id: true, total: true, status: true, guestName: true, user: { select: { firstName: true, lastName: true } } },
      }),

      prisma.order.count({
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
      }),

      prisma.order.count({
        where: { status: "PREPARING" },
      }),

      prisma.product.findMany({
        where: { stock: { lte: lowStockThreshold } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
    ])

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)

    return NextResponse.json({
      success: true,
      data: {
        today: {
          ordersCount: todayOrders.length,
          revenue: Math.round(todayRevenue * 100) / 100,
          orders: todayOrders.map((o) => ({
            id: o.id,
            total: o.total,
            status: o.status,
            customer: o.user
              ? `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim() || "Cliente"
              : (o.guestName ?? "Invitado"),
          })),
        },
        pending: {
          awaitingAttention: pendingOrders,
          preparing: preparingOrders,
        },
        lowStock: {
          count: lowStockProducts.length,
          products: lowStockProducts,
        },
        generatedAt: now.toISOString(),
      },
    })
  } catch (error) {
    console.error("[N8N] Daily stats error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

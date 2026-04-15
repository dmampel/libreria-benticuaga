import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Run independent queries in parallel
    const [
      totalOrders,
      revenueAgg,
      totalCustomers,
      totalProducts,
      ordersThisMonth,
      revenueThisMonthAgg,
      ordersByStatus,
      topProductsRaw,
      recentOrders,
      ordersForChart,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.aggregate({ _sum: { total: true } }),

      prisma.user.count({ where: { isAdmin: false } }),

      prisma.product.count(),

      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),

      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),

      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      prisma.orderItem.groupBy({
        by: ["productId"],
        _count: { productId: true },
        orderBy: { _count: { productId: "desc" } },
        take: 5,
      }),

      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),

      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { total: true, createdAt: true },
      }),
    ])

    // Resolve top product names
    const productIds = topProductsRaw.map((p) => p.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })
    const topProducts = topProductsRaw.map((p) => ({
      productId: p.productId,
      name: products.find((prod) => prod.id === p.productId)?.name ?? p.productId,
      orderCount: p._count.productId,
    }))

    // Build revenue-by-day map (last 30 days, all dates present)
    const revenueMap = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      revenueMap.set(d.toISOString().split("T")[0], 0)
    }
    for (const order of ordersForChart) {
      const date = order.createdAt.toISOString().split("T")[0]
      if (revenueMap.has(date)) {
        revenueMap.set(date, (revenueMap.get(date) ?? 0) + order.total)
      }
    }
    const revenueByDay = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }))

    const statusCounts = Object.fromEntries(
      ordersByStatus.map((s) => [s.status, s._count.status])
    )

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Math.round((revenueAgg._sum.total ?? 0) * 100) / 100,
        totalCustomers,
        totalProducts,
        ordersThisMonth,
        revenueThisMonth: Math.round((revenueThisMonthAgg._sum.total ?? 0) * 100) / 100,
        ordersByStatus: {
          pending: statusCounts["PENDING"] ?? 0,
          confirmed: statusCounts["CONFIRMED"] ?? 0,
          preparing: statusCounts["PREPARING"] ?? 0,
          shipped: statusCounts["SHIPPED"] ?? 0,
          delivered: statusCounts["DELIVERED"] ?? 0,
          cancelled: statusCounts["CANCELLED"] ?? 0,
        },
        topProducts,
        recentOrders,
        revenueByDay,
      },
    })
  } catch (error) {
    console.error("[Admin] Stats error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

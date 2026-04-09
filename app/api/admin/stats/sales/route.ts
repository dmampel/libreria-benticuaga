import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token || !requireAdmin(token).authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const period = searchParams.get("period") ?? "daily" // daily | weekly | monthly
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    const now = new Date()
    const from = fromParam
      ? new Date(fromParam)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const to = toParam ? new Date(toParam + "T23:59:59") : new Date()

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    })

    // Group by period
    const buckets: Record<string, { date: string; orders: number; revenue: number }> = {}

    for (const order of orders) {
      // Shift date to Argentina Time (-3 UTC) to bucket night purchases accurately
      const argDt = new Date(order.createdAt.getTime() - 3 * 60 * 60 * 1000)
      let key: string
      
      if (period === "monthly") {
        key = `${argDt.getFullYear()}-${String(argDt.getMonth() + 1).padStart(2, "0")}`
      } else if (period === "weekly") {
        const day = argDt.getDay() === 0 ? 6 : argDt.getDay() - 1
        const monday = new Date(argDt)
        monday.setDate(argDt.getDate() - day)
        key = monday.toISOString().slice(0, 10)
      } else {
        key = argDt.toISOString().slice(0, 10)
      }

      if (!buckets[key]) buckets[key] = { date: key, orders: 0, revenue: 0 }
      buckets[key].orders += 1
      buckets[key].revenue += order.total
    }

    const data = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date))

    // Summary
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return NextResponse.json({
      success: true,
      data,
      summary: { totalRevenue, totalOrders, avgOrderValue, from: from.toISOString(), to: to.toISOString() },
    })
  } catch (error) {
    console.error("[Admin] Sales stats error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

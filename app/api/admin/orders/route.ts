import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminFromRequest } from "@/lib/admin-auth"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdminFromRequest(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const pageParam = parseInt(searchParams.get("page") ?? "1", 10)
    const limitParam = parseInt(searchParams.get("limit") ?? "50", 10)
    const page = Math.max(1, Number.isNaN(pageParam) ? 1 : pageParam)
    const limit = Math.min(100, Math.max(1, Number.isNaN(limitParam) ? 50 : limitParam))
    const skip = (page - 1) * limit

    const where: Prisma.OrderWhereInput = {}

    if (status) {
      where.status = status as Prisma.EnumOrderStatusFilter
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = toDate
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          items: { select: { id: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[Admin] Orders list error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

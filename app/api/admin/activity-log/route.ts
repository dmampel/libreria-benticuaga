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
    const adminId = searchParams.get("adminId")
    const action = searchParams.get("action")
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (adminId) where.adminId = adminId
    if (action) where.action = action
    if (fromParam || toParam) {
      where.createdAt = {
        ...(fromParam ? { gte: new Date(fromParam) } : {}),
        ...(toParam ? { lte: new Date(toParam + "T23:59:59") } : {}),
      }
    }

    const [entries, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: { select: { id: true, email: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: entries,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("[Admin] Activity log error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

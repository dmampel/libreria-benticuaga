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

    const { searchParams } = request.nextUrl
    const role = searchParams.get("role")
    const search = searchParams.get("search")
    const isAdminFilter = searchParams.get("isAdmin")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const skip = (page - 1) * limit
    const activeFilter = searchParams.get("isActive")

    const where: Record<string, unknown> = {}
    if (role === "RETAIL" || role === "WHOLESALE") where.role = role
    if (isAdminFilter === "true") where.isAdmin = true
    if (isAdminFilter === "false") where.isAdmin = false
    if (activeFilter === "true") where.isActive = true
    if (activeFilter === "false") where.isActive = false
    if (search) {
      where.email = { contains: search, mode: "insensitive" }
    }

    const total = await prisma.user.count({ where })

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[Admin] Users list error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

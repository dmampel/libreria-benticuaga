import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        },
      },
    })

    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("[Admin] User get error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    // Prevent self-demotion
    if (id === auth.userId && body.isAdmin === false) {
      return NextResponse.json(
        { success: false, error: "No podés quitarte el acceso admin a vos mismo" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (typeof body.isAdmin === "boolean") updateData.isAdmin = body.isAdmin
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive
    if (body.role === "RETAIL" || body.role === "WHOLESALE") updateData.role = body.role

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, role: true, isAdmin: true, isActive: true },
    })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "user_updated",
        entityId: id,
        details: JSON.stringify(updateData),
      },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("[Admin] User update error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

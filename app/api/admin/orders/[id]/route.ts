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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            role: true,
            cuit: true,
            razonSocial: true,
          },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, image: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("[Admin] Order detail error:", error)
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

    const existing = await prisma.order.findUnique({ where: { id }, select: { id: true, status: true } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    const { status, shippingAddress, trackingNumber, shippedAt, deliveredAt, notes } = body

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(shippingAddress !== undefined && { shippingAddress }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(shippedAt !== undefined && { shippedAt: shippedAt ? new Date(shippedAt) : null }),
        ...(deliveredAt !== undefined && { deliveredAt: deliveredAt ? new Date(deliveredAt) : null }),
        ...(notes !== undefined && { notes }),
      },
    })

    // Log admin action
    const changes: string[] = []
    if (status !== undefined && status !== existing.status) changes.push(`status: ${existing.status} → ${status}`)
    if (shippingAddress !== undefined) changes.push("shippingAddress updated")
    if (trackingNumber !== undefined) changes.push("trackingNumber updated")
    if (shippedAt !== undefined) changes.push("shippedAt updated")
    if (deliveredAt !== undefined) changes.push("deliveredAt updated")
    if (notes !== undefined) changes.push("notes updated")

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "order_updated",
        entityId: id,
        details: JSON.stringify({ changes }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("[Admin] Order update error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

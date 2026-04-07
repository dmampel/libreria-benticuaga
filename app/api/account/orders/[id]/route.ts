import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const payload = token ? verifyToken(token) : null
    if (!payload) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, image: true } } },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    // Security: ensure order belongs to the requesting user
    if (order.userId !== payload.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("[Account] Order detail error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

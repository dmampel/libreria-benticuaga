import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const payload = token ? verifyToken(token) : null
    if (!payload) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: payload.id },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error("[Account] Orders error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

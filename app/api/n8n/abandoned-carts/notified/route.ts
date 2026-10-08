import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireN8nAuth } from "@/lib/n8n-auth"

const TYPES = ["ABANDONED_CART_EMAIL", "ABANDONED_CART_WHATSAPP"]

export async function POST(request: NextRequest) {
  if (!requireN8nAuth(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { userId, to, type, success } = await request.json()
    if (typeof userId !== "string" || typeof to !== "string" || !to || !TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 })
    }

    const record = await prisma.sentEmail.create({
      data: { userId, to, type, subject: "Carrito abandonado", success: success ?? true },
    })

    return NextResponse.json({ success: true, data: { id: record.id } })
  } catch (error) {
    console.error("[N8N] Abandoned cart notified error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

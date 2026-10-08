import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireN8nAuth } from "@/lib/n8n-auth"

const SENTIMENTS = ["positivo", "neutro", "negativo"]

export async function POST(request: NextRequest) {
  if (!requireN8nAuth(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { orderId, customerName, rating, comment, sentiment, summary, approved } = await request.json()
    if (
      typeof orderId !== "string" || !orderId ||
      !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      !SENTIMENTS.includes(sentiment)
    ) {
      return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
    if (!order) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    const fields = {
      customerName: customerName ?? null,
      rating,
      comment: comment ?? null,
      sentiment,
      summary: summary ?? null,
      approved: approved === true,
    }
    const review = await prisma.review.upsert({
      where: { orderId },
      create: { orderId, ...fields },
      update: fields,
    })

    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    console.error("[N8N] Review error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { createPreference } from "@/lib/mercado-pago"
import { verifyToken } from "@/lib/auth"
import type { Role } from "@prisma/client"

// ============ Types ============

interface CheckoutItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

interface RequestBody {
  items: CheckoutItem[]
  total: number
  userRole: Role
  guestEmail: string
  guestPhone: string
  guestName: string
  guestAddress?: string
  deliveryType: "DELIVERY" | "PICKUP"
  branchName?: string
}

// ============ POST /api/checkout/mercado-pago ============

export async function POST(request: NextRequest): Promise<NextResponse> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL
  // Both back_urls and webhook must be publicly reachable (ngrok in dev)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "MERCADO_PAGO_ACCESS_TOKEN is not configured" },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as RequestBody
    const { items, total, userRole, guestEmail, guestPhone, guestName, guestAddress, deliveryType, branchName } = body

    const token = request.cookies.get("auth_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")
    const payload = token ? verifyToken(token) : null
    const userId = payload?.id || null

    // ── Validation ──────────────────────────────────────────────
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 })
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json({ success: false, error: "Invalid total" }, { status: 400 })
    }

    // Verify products exist
    const productIds = items.map((i) => i.productId)
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    })
    const foundIds = new Set(existingProducts.map((p) => p.id))
    const missing = productIds.filter((id) => !foundIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Products not found: ${missing.join(", ")}` },
        { status: 422 }
      )
    }

    // Pre-generate order ID so MP and DB share the same reference
    const orderId = randomUUID()

    // ── Create MP Preference ─────────────────────────────────────
    const { preferenceId, checkoutUrl } = await createPreference({
      items: items.map((i) => ({
        id: i.productId,
        title: i.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      })),
      externalReference: orderId,
      backUrls: {
        success: `${appUrl}/checkout/success`,
        failure: `${appUrl}/checkout/failure`,
        pending: `${appUrl}/checkout/success`,
      },
      notificationUrl: webhookUrl ?? `${appUrl}/api/webhooks/mercado-pago`,
    })

    // ── Create Order in DB ───────────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          userId,
          guestEmail,
          guestPhone,
          guestName,
          shippingAddress: deliveryType === "DELIVERY" ? (guestAddress ?? null) : null,
          deliveryType,
          branchName: deliveryType === "PICKUP" ? (branchName ?? null) : null,
          total,
          userRole,
          status: "PENDING",
          paymentMethod: "MERCADO_PAGO",
          paymentStatus: "PENDING",
        },
      })

      await tx.orderItem.createMany({
        data: items.map((i) => ({
          orderId: newOrder.id,
          productId: i.productId,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
      })

      return newOrder
    })

    console.log(`[MP Checkout] Order created: ${order.id} | $${total.toFixed(2)} | ${userRole} | guest: ${guestEmail}`)
    console.log(`[MP Checkout] Preference: ${preferenceId} | url: ${checkoutUrl}`)

    return NextResponse.json({ success: true, checkoutUrl, preferenceId, orderId: order.id })
  } catch (error) {
    console.error("[MP Checkout] Fatal error:", error)
    return NextResponse.json(
      { success: false, error: "Error processing payment" },
      { status: 500 }
    )
  }
}

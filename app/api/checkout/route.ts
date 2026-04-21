import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendNewOrderAdminNotification } from "@/lib/order-emails"
import type { Role } from "@prisma/client"

// ============ Types ============

interface CheckoutItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

interface CheckoutBody {
  items: CheckoutItem[]
  total: number
  userRole: Role
  userId?: string
}

// ============ POST /api/checkout ============

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CheckoutBody
    const { items, total, userRole, userId } = body

    // ── Validation ──────────────────────────────────────────────
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      )
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid total" },
        { status: 400 }
      )
    }

    // Verify all products exist in DB (guard against stale cart data)
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

    // ── Create Order + OrderItems in a transaction ───────────────
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: userId ?? null,
          total,
          userRole,
          status: "PENDING",
        },
      })

      await tx.orderItem.createMany({
        data: items.map((i) => ({
          orderId: newOrder.id,
          productId: i.productId,
          quantity: i.quantity,
          price: i.unitPrice, // price locked at time of order
        })),
      })

      return newOrder
    })

    console.log(
      `[Checkout] Order created: ${order.id} | total: $${total.toFixed(2)} | role: ${userRole} | items: ${items.length}`
    )

    sendNewOrderAdminNotification({
      id: order.id,
      total,
      createdAt: order.createdAt,
      shippingAddress: null,
      trackingNumber: null,
      items: items.map((i) => ({ quantity: i.quantity, price: i.unitPrice, product: { id: i.productId, name: i.name } })),
      user: null,
      guestName: null,
      guestEmail: null,
    }).catch((err) => console.error("[Checkout] Admin notification failed:", err))

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error("[Checkout] Fatal error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error during checkout" },
      { status: 500 }
    )
  }
}

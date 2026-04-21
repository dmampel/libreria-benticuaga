import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendNewOrderAdminNotification } from "@/lib/order-emails"
import { verifyToken } from "@/lib/auth"
import type { Role } from "@prisma/client"

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
  guestName: string
  guestEmail: string
  guestPhone: string
  guestAddress?: string
  deliveryType: "DELIVERY" | "PICKUP"
  branchName?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as RequestBody
    const { items, total, userRole, guestName, guestEmail, guestPhone, guestAddress, deliveryType, branchName } = body

    const token = request.cookies.get("auth_token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")
    const payload = token ? verifyToken(token) : null
    const userId = payload?.id || null

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 })
    }

    if (typeof total !== "number" || total <= 0) {
      return NextResponse.json({ success: false, error: "Invalid total" }, { status: 400 })
    }

    if (!guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ success: false, error: "Missing contact fields" }, { status: 400 })
    }

    if (deliveryType === "DELIVERY" && !guestAddress) {
      return NextResponse.json({ success: false, error: "Shipping address is required for delivery" }, { status: 400 })
    }

    if (deliveryType === "PICKUP" && !branchName) {
      return NextResponse.json({ success: false, error: "Branch name is required for pickup" }, { status: 400 })
    }

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

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          guestName,
          guestEmail,
          guestPhone,
          shippingAddress: deliveryType === "DELIVERY" ? (guestAddress ?? null) : null,
          deliveryType,
          branchName: deliveryType === "PICKUP" ? (branchName ?? null) : null,
          paymentMethod: "CASH",
          paymentStatus: "PENDING",
          status: "PENDING",
          total,
          userRole,
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

    console.log(`[Cash Checkout] Order created: ${order.id} | $${total.toFixed(2)} | ${userRole} | ${deliveryType} | guest: ${guestEmail}`)

    sendNewOrderAdminNotification({
      id: order.id,
      total,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
      trackingNumber: null,
      guestName,
      guestEmail,
      user: null,
      items: items.map((i) => ({
        quantity: i.quantity,
        price: i.unitPrice,
        product: { id: i.productId, name: i.name },
      })),
    }).catch((err) => console.error("[Cash Checkout] Admin notification failed:", err))

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error("[Cash Checkout] Fatal error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error during checkout" },
      { status: 500 }
    )
  }
}

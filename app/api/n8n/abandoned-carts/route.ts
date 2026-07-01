import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireN8nAuth } from "@/lib/n8n-auth"

export async function GET(request: NextRequest) {
  if (!requireN8nAuth(request)) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const hoursThreshold = Number(request.nextUrl.searchParams.get("hours") ?? "24")
    const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)
    // Window of 48h to avoid re-notifying carts already processed
    const windowStart = new Date(Date.now() - 48 * 60 * 60 * 1000)

    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: { lte: cutoff, gte: windowStart },
        items: { some: {} },
        user: {
          orders: {
            none: {
              status: { in: ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"] },
              createdAt: { gte: cutoff },
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                retailPrice: true,
                wholesalePrice: true,
                image: true,
              },
            },
          },
        },
      },
    })

    const data = carts.map((cart) => {
      const isWholesale = cart.user.role === "WHOLESALE"
      const items = cart.items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: isWholesale ? item.product.wholesalePrice : item.product.retailPrice,
        image: item.product.image,
      }))
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      return {
        cartId: cart.id,
        lastUpdated: cart.updatedAt,
        user: {
          id: cart.user.id,
          email: cart.user.email,
          name: `${cart.user.firstName ?? ""} ${cart.user.lastName ?? ""}`.trim() || null,
          phone: cart.user.phone ?? null,
        },
        items,
        total,
      }
    })

    return NextResponse.json({ success: true, data, count: data.length })
  } catch (error) {
    console.error("[N8N] Abandoned carts error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

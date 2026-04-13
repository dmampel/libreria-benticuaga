import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

interface SyncItem {
  productId: string
  quantity: number
}

const PRODUCT_SELECT = {
  id: true,
  name: true,
  retailPrice: true,
  wholesalePrice: true,
  stock: true,
  image: true,
} as const

// POST /api/cart/sync — merge guest localStorage cart into DB cart on login
export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  if (!token) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as Record<string, unknown>).items)
  ) {
    return NextResponse.json({ success: false, error: "items array is required" }, { status: 400 })
  }

  const rawItems = (body as { items: unknown[] }).items
  const items: SyncItem[] = rawItems.filter(
    (i): i is SyncItem =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as Record<string, unknown>).productId === "string" &&
      typeof (i as Record<string, unknown>).quantity === "number" &&
      (i as SyncItem).quantity > 0
  )

  try {
    // Get or create cart
    const cart = await prisma.cart.upsert({
      where: { userId: payload.id },
      create: { userId: payload.id },
      update: {},
      include: { items: true },
    })

    // Fetch product stock for all referenced products in one query
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true },
    })
    const stockMap = new Map(products.map((p) => [p.id, p.stock]))

    // Merge: for each valid incoming item, upsert CartItem summing quantities
    for (const item of items) {
      const stock = stockMap.get(item.productId)
      if (stock === undefined) continue // product doesn't exist, skip

      const existing = cart.items.find((ci) => ci.productId === item.productId)
      const newQty = existing
        ? Math.min(existing.quantity + item.quantity, stock)
        : Math.min(item.quantity, stock)

      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
        create: { cartId: cart.id, productId: item.productId, quantity: newQty },
        update: { quantity: newQty },
      })
    }

    // Return full updated cart
    const updated = await prisma.cart.findUnique({
      where: { userId: payload.id },
      include: {
        items: {
          include: { product: { select: PRODUCT_SELECT } },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    console.log(`[Cart] Synced ${items.length} guest items for user ${payload.id}`)
    return NextResponse.json({ success: true, data: updated?.items ?? [] })
  } catch (error) {
    console.error("[Cart] Sync error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// ============ HELPERS ============

const PRODUCT_SELECT = {
  id: true,
  name: true,
  retailPrice: true,
  wholesalePrice: true,
  stock: true,
  image: true,
} as const

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: {
        include: { product: { select: PRODUCT_SELECT } },
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

function authenticate(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  if (!token) return null
  return verifyToken(token)
}

// ============ GET — fetch cart ============

export async function GET(request: NextRequest) {
  const payload = authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  try {
    const cart = await getOrCreateCart(payload.id)
    return NextResponse.json({ success: true, data: cart.items })
  } catch (error) {
    console.error("[Cart] GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// ============ POST — add or increment item ============

export async function POST(request: NextRequest) {
  const payload = authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
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
    typeof (body as Record<string, unknown>).productId !== "string" ||
    typeof (body as Record<string, unknown>).quantity !== "number"
  ) {
    return NextResponse.json({ success: false, error: "productId and quantity are required" }, { status: 400 })
  }

  const { productId, quantity } = body as { productId: string; quantity: number }

  if (quantity <= 0) {
    return NextResponse.json({ success: false, error: "quantity must be > 0" }, { status: 400 })
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } })
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    const cart = await prisma.cart.upsert({
      where: { userId: payload.id },
      create: { userId: payload.id },
      update: {},
    })

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    const newQty = existing
      ? Math.min(existing.quantity + quantity, product.stock)
      : Math.min(quantity, product.stock)

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: newQty },
      update: { quantity: newQty },
    })

    const updated = await getOrCreateCart(payload.id)
    return NextResponse.json({ success: true, data: updated.items })
  } catch (error) {
    console.error("[Cart] POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// ============ PATCH — update item quantity ============

export async function PATCH(request: NextRequest) {
  const payload = authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
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
    typeof (body as Record<string, unknown>).productId !== "string" ||
    typeof (body as Record<string, unknown>).quantity !== "number"
  ) {
    return NextResponse.json({ success: false, error: "productId and quantity are required" }, { status: 400 })
  }

  const { productId, quantity } = body as { productId: string; quantity: number }

  try {
    const cart = await prisma.cart.findUnique({ where: { userId: payload.id } })
    if (!cart) {
      return NextResponse.json({ success: true, data: [] })
    }

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } })
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } })
      if (!product) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
      }
      await prisma.cartItem.updateMany({
        where: { cartId: cart.id, productId },
        data: { quantity: Math.min(Math.max(1, quantity), product.stock) },
      })
    }

    const updated = await getOrCreateCart(payload.id)
    return NextResponse.json({ success: true, data: updated.items })
  } catch (error) {
    console.error("[Cart] PATCH error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// ============ DELETE — remove item ============

export async function DELETE(request: NextRequest) {
  const payload = authenticate(request)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
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
    typeof (body as Record<string, unknown>).productId !== "string"
  ) {
    return NextResponse.json({ success: false, error: "productId is required" }, { status: 400 })
  }

  const { productId } = body as { productId: string }

  try {
    const cart = await prisma.cart.findUnique({ where: { userId: payload.id } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } })
    }

    const updated = await getOrCreateCart(payload.id)
    return NextResponse.json({ success: true, data: updated.items })
  } catch (error) {
    console.error("[Cart] DELETE error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

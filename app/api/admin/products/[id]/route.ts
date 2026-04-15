import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error("[Admin] Product get error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, description, retailPrice, wholesalePrice, stock, image, categoryId, brandId } = body

    if (!name?.trim()) return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 })
    if (!retailPrice || Number(retailPrice) <= 0) return NextResponse.json({ success: false, error: "Precio minorista inválido" }, { status: 400 })
    if (!wholesalePrice || Number(wholesalePrice) <= 0) return NextResponse.json({ success: false, error: "Precio mayorista inválido" }, { status: 400 })
    if (Number(wholesalePrice) >= Number(retailPrice)) return NextResponse.json({ success: false, error: "Precio mayorista debe ser menor al minorista" }, { status: 400 })

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        retailPrice: Number(retailPrice),
        wholesalePrice: Number(wholesalePrice),
        stock: Number(stock),
        image: image?.trim() || "",
        categoryId: categoryId || null,
        brandId: brandId || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "product_updated",
        entityId: id,
        details: JSON.stringify({ name: product.name }),
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error("[Admin] Product update error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const { stock } = await request.json()

    if (stock === undefined || stock === null || Number(stock) < 0) {
      return NextResponse.json({ success: false, error: "Stock inválido" }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: { stock: Number(stock) },
    })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "product_stock_updated",
        entityId: id,
        details: JSON.stringify({ stock: Number(stock) }),
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error("[Admin] Product stock update error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } })
    if (orderItemCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: el producto tiene ${orderItemCount} pedido(s) asociado(s)` },
        { status: 409 }
      )
    }

    const product = await prisma.product.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "product_deleted",
        entityId: id,
        details: JSON.stringify({ name: product.name }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin] Product delete error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

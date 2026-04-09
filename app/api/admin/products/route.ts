import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const categoryId = searchParams.get("category")
    const sort = searchParams.get("sort") ?? "name"
    const order = (searchParams.get("order") ?? "asc") as "asc" | "desc"
    const stockFilter = searchParams.get("stock") // "in_stock" | "low" | "out"

    const where: Prisma.ProductWhereInput = {}
    if (categoryId) where.categoryId = categoryId
    if (stockFilter === "out") where.stock = { equals: 0 }
    else if (stockFilter === "low") where.stock = { gt: 0, lte: 10 }
    else if (stockFilter === "in_stock") where.stock = { gt: 10 }

    const validSortFields: Record<string, Prisma.ProductOrderByWithRelationInput> = {
      name: { name: order },
      retailPrice: { retailPrice: order },
      wholesalePrice: { wholesalePrice: order },
      stock: { stock: order },
      createdAt: { createdAt: order },
    }
    const orderBy = validSortFields[sort] ?? { name: "asc" }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: { category: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error("[Admin] Products list error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, retailPrice, wholesalePrice, stock, image, categoryId } = body

    const resolvedId = id?.trim() ||
      "PRD-" + Math.random().toString(36).slice(2, 7).toUpperCase()
    if (!name?.trim()) return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 })
    if (!retailPrice || Number(retailPrice) <= 0) return NextResponse.json({ success: false, error: "Precio minorista inválido" }, { status: 400 })
    if (!wholesalePrice || Number(wholesalePrice) <= 0) return NextResponse.json({ success: false, error: "Precio mayorista inválido" }, { status: 400 })
    if (Number(wholesalePrice) >= Number(retailPrice)) return NextResponse.json({ success: false, error: "Precio mayorista debe ser menor al minorista" }, { status: 400 })
    if (stock === undefined || stock === null || Number(stock) < 0) return NextResponse.json({ success: false, error: "Stock inválido" }, { status: 400 })

    const existing = await prisma.product.findUnique({ where: { id: resolvedId } })
    if (existing) return NextResponse.json({ success: false, error: "Ya existe un producto con ese ID" }, { status: 409 })

    const product = await prisma.product.create({
      data: {
        id: resolvedId,
        name: name.trim(),
        description: description?.trim() || null,
        retailPrice: Number(retailPrice),
        wholesalePrice: Number(wholesalePrice),
        stock: Number(stock),
        image: image?.trim() || "",
        categoryId: categoryId || null,
      },
      include: { category: { select: { id: true, name: true } } },
    })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "product_created",
        entityId: product.id,
        details: JSON.stringify({ name: product.name }),
      },
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    console.error("[Admin] Product create error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

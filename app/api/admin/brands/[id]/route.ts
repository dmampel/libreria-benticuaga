import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token || !requireAdmin(token).authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })

    if (!brand) {
      return NextResponse.json({ success: false, error: "Marca no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: brand })
  } catch (error) {
    console.error("[Admin] Brand get error:", error)
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
    const { name, image } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 })
    }

    const duplicate = await prisma.brand.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" }, NOT: { id } },
    })
    if (duplicate) {
      return NextResponse.json({ success: false, error: "Ya existe una marca con ese nombre" }, { status: 409 })
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: name.trim(),
        image: image?.trim() || null,
        searchName: name.trim().toLowerCase(),
      },
    })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "brand_updated",
        entityId: id,
        details: JSON.stringify({ name: brand.name }),
      },
    })

    return NextResponse.json({ success: true, data: brand })
  } catch (error) {
    console.error("[Admin] Brand update error:", error)
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

    const productCount = await prisma.product.count({ where: { brandId: id } })
    if (productCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: la marca tiene ${productCount} producto(s) asociado(s)` },
        { status: 409 }
      )
    }

    const brand = await prisma.brand.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "brand_deleted",
        entityId: id,
        details: JSON.stringify({ name: brand.name }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin] Brand delete error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

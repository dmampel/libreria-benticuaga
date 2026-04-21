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
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ success: false, error: "Categoría no encontrada" }, { status: 404 })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("[Admin] Category get error:", error)
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
    const { name, slug, icon, image, parentId } = await request.json()

    if (!name?.trim()) return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 })
    if (!slug?.trim()) return NextResponse.json({ success: false, error: "Slug requerido" }, { status: 400 })

    if (parentId === id) return NextResponse.json({ success: false, error: "Una categoría no puede ser padre de sí misma" }, { status: 400 })

    if (parentId) {
      const parentExists = await prisma.category.findUnique({ where: { id: parentId } })
      if (!parentExists) return NextResponse.json({ success: false, error: "Categoría padre no encontrada" }, { status: 400 })
      // Prevent nesting more than 1 level if desired, optional, but let's keep it simple for now
    }

    const slugConflict = await prisma.category.findFirst({
      where: { slug: slug.trim(), NOT: { id } },
    })
    if (slugConflict) return NextResponse.json({ success: false, error: "Slug ya en uso por otra categoría" }, { status: 409 })

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug: slug.trim(), icon: icon?.trim() || null, image: image?.trim() || null, parentId: parentId || null },
    })

    await prisma.activityLog.create({
      data: { adminId: auth.userId, action: "category_updated", entityId: id, details: JSON.stringify({ name: category.name }) },
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("[Admin] Category update error:", error)
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

    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: tiene ${productCount} producto(s) asociado(s).` },
        { status: 409 }
      )
    }

    const childCount = await prisma.category.count({ where: { parentId: id } })
    if (childCount > 0) {
       return NextResponse.json(
        { success: false, error: `No se puede eliminar: tiene ${childCount} subcategoría(s) hija(s) asociada(s).` },
        { status: 409 }
       )
    }

    const category = await prisma.category.delete({ where: { id } })

    await prisma.activityLog.create({
      data: { adminId: auth.userId, action: "category_deleted", entityId: id, details: JSON.stringify({ name: category.name }) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin] Category delete error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

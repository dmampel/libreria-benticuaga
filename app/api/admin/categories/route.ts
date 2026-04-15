import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token || !requireAdmin(token).authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { 
        _count: { select: { products: true } },
        children: true,
      },
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error("[Admin] Categories list error:", error)
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

    const { name, slug, icon, parentId } = await request.json()

    if (!name?.trim()) return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 })
    if (!slug?.trim()) return NextResponse.json({ success: false, error: "Slug requerido" }, { status: 400 })

    // Validar que parentId exista si es enviado
    if (parentId) {
      const parentExists = await prisma.category.findUnique({ where: { id: parentId } })
      if (!parentExists) return NextResponse.json({ success: false, error: "Categoría padre no encontrada" }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({ where: { slug: slug.trim() } })
    if (existing) return NextResponse.json({ success: false, error: "Ya existe una categoría con ese slug" }, { status: 409 })

    const category = await prisma.category.create({
      data: { name: name.trim(), slug: slug.trim(), icon: icon?.trim() || null, parentId: parentId || null },
    })

    await prisma.activityLog.create({
      data: { adminId: auth.userId, action: "category_created", entityId: category.id, details: JSON.stringify({ name: category.name }) },
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    console.error("[Admin] Category create error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token || !requireAdmin(token).authorized) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    })

    return NextResponse.json({ success: true, data: brands })
  } catch (error) {
    console.error("[Admin] Brands list error:", error)
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

    const { name, image } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 })
    }

    const existing = await prisma.brand.findFirst({ where: { name: { equals: name.trim(), mode: "insensitive" } } })
    if (existing) {
      return NextResponse.json({ success: false, error: "Ya existe una marca con ese nombre" }, { status: 409 })
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        image: image?.trim() || null,
        searchName: name.trim().toLowerCase(),
      },
    })

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "brand_created",
        entityId: brand.id,
        details: JSON.stringify({ name: brand.name }),
      },
    })

    return NextResponse.json({ success: true, data: brand }, { status: 201 })
  } catch (error) {
    console.error("[Admin] Brand create error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

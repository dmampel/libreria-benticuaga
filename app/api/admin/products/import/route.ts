import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { parseCsv } from "@/lib/csv-parser"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const auth = token ? requireAdmin(token) : { authorized: false }
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Falta el archivo" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { products, errors } = await parseCsv(buffer, file.name)

    let created = 0
    let updated = 0

    for (const product of products) {
      const existing = await prisma.product.findUnique({ where: { id: product.id } })
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          stock: product.stock,
          image: product.image,
        },
        create: {
          id: product.id,
          name: product.name,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          stock: product.stock,
          image: product.image,
        },
      })
      if (existing) updated++
      else created++
    }

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "csv_import",
        details: JSON.stringify({ file: file.name, created, updated, errors: errors.length }),
      },
    })

    console.log(`[Admin CSV Import] ${file.name}: ${created} created, ${updated} updated, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors: errors.length,
      errorDetails: errors.map((e) => ({ row: e.row, reason: e.reason })),
    })
  } catch (error) {
    console.error("[Admin] CSV import error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

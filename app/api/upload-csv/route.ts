import { NextRequest, NextResponse } from "next/server"
import { parseCsv } from "@/lib/csv-parser"
import { prisma } from "@/lib/prisma"
import { normalizeText } from "@/lib/utils/normalize"

// ============ Types ============
// ... (rest of imports and types)

interface UploadSummary {
  created: number
  updated: number
  errors: number
  errorDetails: Array<{ row: number; reason: string; raw: Record<string, string> }>
}

// ============ POST /api/upload-csv ============

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing 'file' field in form data" },
        { status: 400 }
      )
    }

    const filename = file.name
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse and validate CSV
    const { products, errors } = await parseCsv(buffer, filename)

    // Upsert each valid product
    let created = 0
    let updated = 0

    for (const product of products) {
      const existing = await prisma.product.findUnique({ where: { id: product.id } })

      const searchName = normalizeText(product.name)

      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          stock: product.stock,
          image: product.image,
          searchName,
        },
        create: {
          id: product.id,
          name: product.name,
          retailPrice: product.retailPrice,
          wholesalePrice: product.wholesalePrice,
          stock: product.stock,
          image: product.image,
          searchName,
        },
      })

      if (existing) {
        updated++
      } else {
        created++
      }
    }

    const summary: UploadSummary = {
      created,
      updated,
      errors: errors.length,
      errorDetails: errors.map((e) => ({
        row: e.row,
        reason: e.reason,
        raw: e.raw,
      })),
    }

    console.log(
      `[CSV Import] SUMMARY: ${created} created, ${updated} updated, ${errors.length} errors`
    )

    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    console.error("[CSV Import] Fatal error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error during CSV import" },
      { status: 500 }
    )
  }
}

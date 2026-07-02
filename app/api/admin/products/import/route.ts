import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdminFromRequest } from "@/lib/admin-auth"
import { parseCsv, type ParsedProduct } from "@/lib/csv-parser"

// Max rows per batched DB statement. Keeps bind parameters (6 cols x rows)
// well under PostgreSQL's 65,535 parameter limit per statement.
const BATCH_SIZE = 500

/**
 * Splits an array into chunks of at most `size` items each.
 */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdminFromRequest(request)
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

    if (products.length === 0) {
      // Empty or all-invalid input: no DB writes, still log the attempt.
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
    }

    // Bulk pre-check: determine which ids already exist so created/updated
    // counts can be derived without a per-row read.
    const existingIds = new Set<string>()
    for (const idChunk of chunk(products.map((p) => p.id), BATCH_SIZE)) {
      const found = await prisma.product.findMany({
        where: { id: { in: idChunk } },
        select: { id: true },
      })
      for (const row of found) existingIds.add(row.id)
    }

    updated = products.filter((p) => existingIds.has(p.id)).length
    created = products.length - updated

    // Batched, atomic upsert: the whole import lands or none of it does.
    await prisma.$transaction(
      async (tx) => {
        for (const productChunk of chunk(products, BATCH_SIZE)) {
          const rows = productChunk.map(
            (p: ParsedProduct) =>
              Prisma.sql`(${p.id}, ${p.name}, ${p.retailPrice}, ${p.wholesalePrice}, ${p.stock}, ${p.image}, NOW())`
          )

          await tx.$executeRaw`
            INSERT INTO "Product" (id, name, "retailPrice", "wholesalePrice", stock, image, "updatedAt")
            VALUES ${Prisma.join(rows)}
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              "retailPrice" = EXCLUDED."retailPrice",
              "wholesalePrice" = EXCLUDED."wholesalePrice",
              stock = EXCLUDED.stock,
              image = EXCLUDED.image,
              "updatedAt" = EXCLUDED."updatedAt"
          `
        }
      },
      // Default interactive-transaction timeouts (5s) are too tight for a
      // 10,000+ row catalog import; give the batched writes room to complete.
      { maxWait: 10_000, timeout: 60_000 }
    )

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

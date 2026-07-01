import { NextRequest, NextResponse } from "next/server"
import { parse } from "csv-parse"
import { Readable } from "stream"
import { prisma } from "@/lib/prisma"
import { requireAdminFromRequest } from "@/lib/admin-auth"
import { normalizeText } from "@/lib/utils/normalize"

type RawRow = Record<string, string>

const VALID_URL = /^https?:\/\/.+/

interface ParsedBrand {
  name: string
  image: string
}

interface RowError {
  row: number
  reason: string
}

async function parseBrandCsv(buffer: Buffer): Promise<{ brands: ParsedBrand[]; errors: RowError[] }> {
  const brands: ParsedBrand[] = []
  const errors: RowError[] = []
  const seenNames = new Set<string>()

  const rows = await new Promise<RawRow[]>((resolve, reject) => {
    const results: RawRow[] = []
    Readable.from(buffer)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }))
      .on("data", (row: RawRow) => results.push(row))
      .on("error", reject)
      .on("end", () => resolve(results))
  })

  rows.forEach((raw, index) => {
    const rowNumber = index + 2

    const name = raw.name?.trim()
    if (!name) {
      errors.push({ row: rowNumber, reason: "name es requerido" })
      return
    }
    if (name.length > 200) {
      errors.push({ row: rowNumber, reason: "name excede 200 caracteres" })
      return
    }

    const key = normalizeText(name)
    if (seenNames.has(key)) {
      errors.push({ row: rowNumber, reason: `nombre duplicado en el archivo: "${name}"` })
      return
    }

    const image = raw.image?.trim() ?? ""
    if (image && !VALID_URL.test(image)) {
      console.warn(`[Brand Import] Row ${rowNumber}: invalid image URL, storing empty`)
    }

    seenNames.add(key)
    brands.push({ name, image: VALID_URL.test(image) ? image : "" })
  })

  return { brands, errors }
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
    const { brands, errors } = await parseBrandCsv(buffer)

    let created = 0
    let updated = 0

    for (const brand of brands) {
      const searchName = normalizeText(brand.name)
      const existing = await prisma.brand.findFirst({ where: { searchName } })

      if (existing) {
        await prisma.brand.update({
          where: { id: existing.id },
          data: { name: brand.name, image: brand.image || existing.image, searchName },
        })
        updated++
      } else {
        await prisma.brand.create({
          data: { name: brand.name, image: brand.image || null, searchName },
        })
        created++
      }
    }

    await prisma.activityLog.create({
      data: {
        adminId: auth.userId,
        action: "brands_csv_import",
        details: JSON.stringify({ file: file.name, created, updated, errors: errors.length }),
      },
    })

    console.log(`[Admin Brand Import] ${file.name}: ${created} created, ${updated} updated, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors: errors.length,
      errorDetails: errors,
    })
  } catch (error) {
    console.error("[Admin] Brand CSV import error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

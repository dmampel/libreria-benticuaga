import { parse } from "csv-parse"
import { Readable } from "stream"

// ============ Types ============

type RawCsvRow = Record<string, string>

export interface ParsedProduct {
  id: string
  name: string
  retailPrice: number
  wholesalePrice: number
  stock: number
  image: string
}

export interface CsvParseResult {
  products: ParsedProduct[]
  errors: CsvRowError[]
}

export interface CsvRowError {
  row: number
  raw: Record<string, string>
  reason: string
}

// ============ Constants ============

const MAX_ID_LENGTH = 50
const MAX_NAME_LENGTH = 500
const VALID_URL_PATTERN = /^https?:\/\/.+/

// ============ Row validator ============

function validateRow(
  raw: RawCsvRow,
  rowIndex: number,
  seenIds: Set<string>
): { product: ParsedProduct } | { error: CsvRowError } {
  const makeError = (reason: string): { error: CsvRowError } => ({
    error: { row: rowIndex, raw: raw as Record<string, string>, reason },
  })

  // cod_prod
  const id = raw.cod_prod?.trim()
  if (!id) return makeError("cod_prod is required")
  if (id.length > MAX_ID_LENGTH)
    return makeError(`cod_prod exceeds ${MAX_ID_LENGTH} chars`)
  if (seenIds.has(id)) {
    console.warn(`[CSV Import] Row ${rowIndex}: duplicate cod_prod "${id}", skipping`)
    return makeError(`duplicate cod_prod "${id}" in this file`)
  }

  // desc
  const name = raw.desc?.trim()
  if (!name) return makeError("desc is required")
  if (name.length > MAX_NAME_LENGTH)
    return makeError(`desc exceeds ${MAX_NAME_LENGTH} chars`)

  // precio1 → retailPrice
  const retailPrice = parseFloat(raw.precio1)
  if (!raw.precio1 || isNaN(retailPrice) || retailPrice <= 0)
    return makeError("precio1 must be a number > 0")

  // precio2 → wholesalePrice
  const wholesalePrice = parseFloat(raw.precio2)
  if (!raw.precio2 || isNaN(wholesalePrice) || wholesalePrice <= 0)
    return makeError("precio2 must be a number > 0")
  if (wholesalePrice >= retailPrice)
    return makeError("precio2 must be less than precio1")

  // stk → stock
  const stock = parseInt(raw.stk, 10)
  if (!raw.stk && raw.stk !== "0" || isNaN(stock) || stock < 0)
    return makeError("stk must be an integer >= 0")

  // img_url (optional)
  const image = raw.img_url?.trim() ?? ""
  if (image && !VALID_URL_PATTERN.test(image)) {
    console.warn(`[CSV Import] Row ${rowIndex}: invalid img_url "${image}", storing empty`)
  }

  seenIds.add(id)

  return {
    product: {
      id,
      name,
      retailPrice,
      wholesalePrice,
      stock,
      image: VALID_URL_PATTERN.test(image) ? image : "",
    },
  }
}

// ============ Main parser ============

export async function parseCsv(buffer: Buffer, filename: string): Promise<CsvParseResult> {
  console.log(`[CSV Import] Processing file: ${filename}`)

  const products: ParsedProduct[] = []
  const errors: CsvRowError[] = []
  const seenIds = new Set<string>()

  const rows = await new Promise<RawCsvRow[]>((resolve, reject) => {
    const results: RawCsvRow[] = []
    const stream = Readable.from(buffer)

    stream
      .pipe(
        parse({
          columns: true,        // use first row as header
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true, // tolerate extra/missing columns
        })
      )
      .on("data", (row: RawCsvRow) => results.push(row))
      .on("error", reject)
      .on("end", () => resolve(results))
  })

  rows.forEach((raw, index) => {
    const rowNumber = index + 2 // +2: 1-based + header row
    const result = validateRow(raw, rowNumber, seenIds)

    if ("product" in result) {
      products.push(result.product)
    } else {
      console.log(`[CSV Import] Row ${rowNumber}: ${result.error.reason}, skipping`)
      errors.push(result.error)
    }
  })

  return { products, errors }
}

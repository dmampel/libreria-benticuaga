import { PrismaClient } from "@prisma/client"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

const prisma = new PrismaClient()

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          if (val === null || val === undefined) return ""
          const str = String(val)
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(",")
    ),
  ]
  return lines.join("\n")
}

async function main() {
  const outDir = join(process.cwd(), "db-backup")
  mkdirSync(outDir, { recursive: true })

  const tables: { name: string; data: unknown[] }[] = [
    { name: "Category", data: await prisma.category.findMany() },
    { name: "Brand", data: await prisma.brand.findMany() },
    { name: "Product", data: await prisma.product.findMany() },
    { name: "User", data: await prisma.user.findMany() },
    { name: "Order", data: await prisma.order.findMany() },
    { name: "OrderItem", data: await prisma.orderItem.findMany() },
    { name: "Cart", data: await prisma.cart.findMany() },
    { name: "CartItem", data: await prisma.cartItem.findMany() },
    { name: "ActivityLog", data: await prisma.activityLog.findMany() },
    { name: "EmailPreferences", data: await prisma.emailPreferences.findMany() },
    { name: "SentEmail", data: await prisma.sentEmail.findMany() },
  ]

  for (const { name, data } of tables) {
    const csv = toCSV(data as Record<string, unknown>[])
    const outPath = join(outDir, `${name}.csv`)
    writeFileSync(outPath, csv, "utf8")
    console.log(`✓ ${name}: ${data.length} rows → ${outPath}`)
  }

  console.log("\n✅ Export complete. Files saved to db-backup/")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

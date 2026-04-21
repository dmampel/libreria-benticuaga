import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import { join } from "path"

const prisma = new PrismaClient()

function parseDate(val: string): Date | null {
  if (!val || val.trim() === "") return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function parseBool(val: string): boolean {
  return val === "true"
}

function parseFloat2(val: string): number | null {
  if (!val || val.trim() === "") return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function parseInt2(val: string): number | null {
  if (!val || val.trim() === "") return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n")
  if (lines.length < 2) return []
  const headers = lines[0].split(",")
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const row: Record<string, string> = {}
    const line = lines[i]
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') { current += '"'; j++ }
        else inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        values.push(current); current = ""
      } else {
        current += ch
      }
    }
    values.push(current)

    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] ?? "").trim() })
    rows.push(row)
  }
  return rows
}

function readCSV(filename: string): Record<string, string>[] {
  const path = join(process.cwd(), "db-backup", filename)
  const content = readFileSync(path, "utf8")
  return parseCSV(content)
}

async function main() {
  console.log("🗑️  Clearing all tables...")

  await prisma.activityLog.deleteMany()
  await prisma.sentEmail.deleteMany()
  await prisma.emailPreferences.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  await prisma.brand.deleteMany()

  // Categories: delete children before parents
  await prisma.$executeRaw`DELETE FROM "Category"`

  console.log("✅ All tables cleared\n")

  // ── Categories (parents first, then children)
  const categories = readCSV("Category.csv")
  const parents = categories.filter((r) => !r.parentId)
  const children = categories.filter((r) => !!r.parentId)

  for (const r of [...parents, ...children]) {
    await prisma.category.create({
      data: {
        id: r.id,
        name: r.name,
        slug: r.slug,
        icon: r.icon || null,
        image: r.image || null,
        parentId: r.parentId || null,
        searchName: r.searchName || "",
        createdAt: parseDate(r.createdAt) ?? new Date(),
        updatedAt: parseDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ Category: ${categories.length} rows`)

  // ── Brands
  const brands = readCSV("Brand.csv")
  for (const r of brands) {
    await prisma.brand.create({
      data: {
        id: r.id,
        name: r.name,
        image: r.image || null,
        searchName: r.searchName || "",
        createdAt: parseDate(r.createdAt) ?? new Date(),
        updatedAt: parseDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ Brand: ${brands.length} rows`)

  // ── Products
  const products = readCSV("Product.csv")
  for (const r of products) {
    await prisma.product.create({
      data: {
        id: r.id,
        name: r.name,
        description: r.description || null,
        retailPrice: parseFloat2(r.retailPrice)!,
        wholesalePrice: parseFloat2(r.wholesalePrice)!,
        stock: parseInt2(r.stock)!,
        image: r.image,
        categoryId: r.categoryId || null,
        brandId: r.brandId || null,
        searchName: r.searchName || "",
        searchDescription: r.searchDescription || null,
        createdAt: parseDate(r.createdAt) ?? new Date(),
        updatedAt: parseDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ Product: ${products.length} rows`)

  // ── Users
  const users = readCSV("User.csv")
  for (const r of users) {
    await prisma.user.create({
      data: {
        id: r.id,
        email: r.email,
        password: r.password,
        role: r.role as "RETAIL" | "WHOLESALE",
        isAdmin: parseBool(r.isAdmin),
        isActive: parseBool(r.isActive),
        firstName: r.firstName || null,
        lastName: r.lastName || null,
        address: r.address || null,
        phone: r.phone || null,
        cuit: r.cuit || null,
        razonSocial: r.razonSocial || null,
        emailVerified: parseDate(r.emailVerified),
        emailVerificationToken: r.emailVerificationToken || null,
        passwordResetToken: r.passwordResetToken || null,
        passwordResetExpiresAt: parseDate(r.passwordResetExpiresAt),
        createdAt: parseDate(r.createdAt) ?? new Date(),
        updatedAt: parseDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ User: ${users.length} rows`)

  // ── Orders (backup doesn't have deliveryType/paymentStatus/branchName — use defaults)
  const orders = readCSV("Order.csv")
  for (const r of orders) {
    const status = r.status as "PENDING" | "CONFIRMED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
    const isPaid = status === "CONFIRMED" || status === "DELIVERED" || status === "SHIPPED" || status === "PREPARING"
    await prisma.order.create({
      data: {
        id: r.id,
        userId: r.userId || null,
        total: parseFloat2(r.total)!,
        status,
        userRole: r.userRole || "RETAIL",
        paymentMethod: (r.paymentMethod as "MERCADO_PAGO" | "CASH") || null,
        paymentStatus: isPaid ? "PAID" : "PENDING",
        transactionId: r.transactionId || null,
        deliveryType: "DELIVERY",
        branchName: null,
        guestEmail: r.guestEmail || null,
        guestPhone: r.guestPhone || null,
        guestName: r.guestName || null,
        shippingAddress: r.shippingAddress || null,
        trackingNumber: r.trackingNumber || null,
        shippedAt: parseDate(r.shippedAt),
        deliveredAt: parseDate(r.deliveredAt),
        notes: r.notes || null,
        confirmationEmailSent: parseBool(r.confirmationEmailSent),
        statusUpdateEmailSent: parseBool(r.statusUpdateEmailSent),
        createdAt: parseDate(r.createdAt) ?? new Date(),
        updatedAt: parseDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ Order: ${orders.length} rows`)

  // ── OrderItems
  const orderItems = readCSV("OrderItem.csv")
  for (const r of orderItems) {
    await prisma.orderItem.create({
      data: {
        id: r.id,
        orderId: r.orderId,
        productId: r.productId,
        quantity: parseInt2(r.quantity)!,
        price: parseFloat2(r.price)!,
        createdAt: parseDate(r.createdAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ OrderItem: ${orderItems.length} rows`)

  // ── Carts
  const carts = readCSV("Cart.csv")
  for (const r of carts) {
    if (!r.id) continue
    await prisma.cart.create({
      data: {
        id: r.id,
        userId: r.userId,
        createdAt: parseDate(r.createdAt) ?? new Date(),
        updatedAt: parseDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ Cart: ${carts.length} rows`)

  // ── CartItems
  const cartItems = readCSV("CartItem.csv")
  for (const r of cartItems) {
    if (!r.id) continue
    await prisma.cartItem.create({
      data: {
        id: r.id,
        cartId: r.cartId,
        productId: r.productId,
        quantity: parseInt2(r.quantity)!,
        createdAt: parseDate(r.createdAt) ?? new Date(),
        updatedAt: parseDate(r.updatedAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ CartItem: ${cartItems.length} rows`)

  // ── ActivityLog
  const logs = readCSV("ActivityLog.csv")
  for (const r of logs) {
    await prisma.activityLog.create({
      data: {
        id: r.id,
        adminId: r.adminId,
        action: r.action,
        entityId: r.entityId || null,
        details: r.details || null,
        createdAt: parseDate(r.createdAt) ?? new Date(),
      },
    })
  }
  console.log(`✓ ActivityLog: ${logs.length} rows`)

  console.log("\n✅ Import complete!")
}

main()
  .catch((e) => { console.error("❌ Import failed:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())

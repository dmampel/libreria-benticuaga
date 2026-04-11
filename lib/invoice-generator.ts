import jsPDF from "jspdf"
import type { OrderEmailData } from "@/lib/email-templates"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function generateInvoicePDF(order: OrderEmailData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const invoiceNum = order.id.slice(0, 8).toUpperCase()
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229) // indigo-600
  doc.rect(0, 0, pageW, 40, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("Librería Benticuaga", margin, 18)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Mendoza, Argentina", margin, 26)

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("FACTURA / COMPROBANTE", pageW - margin, 18, { align: "right" })
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`N° ${invoiceNum}`, pageW - margin, 26, { align: "right" })
  doc.text(formatDate(order.createdAt), pageW - margin, 33, { align: "right" })

  // ── Customer info ────────────────────────────────────────────────────────
  let y = 55
  doc.setTextColor(17, 24, 39) // gray-900
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("CLIENTE", margin, y)

  y += 6
  doc.setFont("helvetica", "normal")
  doc.setTextColor(55, 65, 81) // gray-700

  const customerName =
    order.user?.firstName || order.user?.lastName
      ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ")
      : "—"
  doc.text(`Nombre: ${customerName}`, margin, y)
  y += 5
  doc.text(`Email: ${order.user?.email ?? "—"}`, margin, y)
  if (order.shippingAddress) {
    y += 5
    doc.text(`Dirección: ${order.shippingAddress}`, margin, y)
  }

  // ── Divider ──────────────────────────────────────────────────────────────
  y += 10
  doc.setDrawColor(229, 231, 235) // gray-200
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)

  // ── Items table header ────────────────────────────────────────────────────
  y += 8
  doc.setFillColor(249, 250, 251) // gray-50
  doc.rect(margin, y - 4, pageW - margin * 2, 10, "F")

  doc.setTextColor(107, 114, 128) // gray-500
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")

  const colProduct = margin + 2
  const colQty = pageW - margin - 65
  const colUnit = pageW - margin - 40
  const colTotal = pageW - margin - 2

  doc.text("PRODUCTO", colProduct, y + 2)
  doc.text("CANT.", colQty, y + 2, { align: "right" })
  doc.text("P. UNIT.", colUnit, y + 2, { align: "right" })
  doc.text("SUBTOTAL", colTotal, y + 2, { align: "right" })

  // ── Items rows ────────────────────────────────────────────────────────────
  y += 10
  doc.setFont("helvetica", "normal")
  doc.setTextColor(55, 65, 81)
  doc.setFontSize(9)

  for (const item of order.items) {
    doc.text(item.product.name, colProduct, y)
    doc.text(String(item.quantity), colQty, y, { align: "right" })
    doc.text(formatCurrency(item.price), colUnit, y, { align: "right" })
    doc.text(formatCurrency(item.price * item.quantity), colTotal, y, { align: "right" })
    y += 7
    doc.setDrawColor(243, 244, 246)
    doc.line(margin, y - 2, pageW - margin, y - 2)
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  y += 4
  doc.setFillColor(238, 242, 255) // indigo-50
  doc.rect(pageW - margin - 80, y - 5, 80, 12, "F")

  doc.setTextColor(17, 24, 39)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("TOTAL", pageW - margin - 42, y + 2, { align: "right" })

  doc.setTextColor(79, 70, 229)
  doc.setFontSize(12)
  doc.text(formatCurrency(order.total), colTotal, y + 2, { align: "right" })

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(156, 163, 175)
  doc.text("Librería Benticuaga · Mendoza, Argentina", pageW / 2, footerY, { align: "center" })
  doc.text("Gracias por tu compra", pageW / 2, footerY + 5, { align: "center" })

  return Buffer.from(doc.output("arraybuffer"))
}

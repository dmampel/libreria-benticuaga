import { sendEmail } from "@/lib/email"
import {
  getOrderConfirmationHTML,
  getOrderShippedHTML,
  getOrderDeliveredHTML,
  type OrderEmailData,
} from "@/lib/email-templates"
import { generateInvoicePDF } from "@/lib/invoice-generator"
import { prisma } from "@/lib/prisma"

export type { OrderEmailData }

async function getUserPreferences(userId: string | undefined | null) {
  if (!userId) return null
  return prisma.emailPreferences.findUnique({ where: { userId } })
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<void> {
  const to = order.user?.email
  if (!to) {
    console.warn(`[OrderEmail] No user email on order ${order.id} — skipping confirmation`)
    return
  }

  const prefs = await getUserPreferences(order.user?.id)
  if (prefs && !prefs.orderConfirmation) {
    console.log(`[OrderEmail] User disabled orderConfirmation — skipping`)
    return
  }

  const html = getOrderConfirmationHTML(order)
  await sendEmail(to, `Pedido confirmado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

export async function sendOrderConfirmationEmailWithInvoice(order: OrderEmailData): Promise<void> {
  const to = order.user?.email
  if (!to) {
    console.warn(`[OrderEmail] No user email on order ${order.id} — skipping confirmation+invoice`)
    return
  }

  const prefs = await getUserPreferences(order.user?.id)
  if (prefs && !prefs.orderConfirmation) {
    console.log(`[OrderEmail] User disabled orderConfirmation — skipping`)
    return
  }

  const html = getOrderConfirmationHTML(order)

  let invoicePDF: Buffer | undefined
  try {
    invoicePDF = generateInvoicePDF(order)
  } catch (err) {
    console.error("[OrderEmail] Failed to generate invoice PDF:", err)
  }

  await sendEmail(
    to,
    `Pedido confirmado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`,
    html,
    invoicePDF
      ? [{ filename: `factura-${order.id.slice(0, 8).toUpperCase()}.pdf`, content: invoicePDF }]
      : undefined
  )
}

export async function sendOrderShippedEmail(order: OrderEmailData, trackingNumber: string): Promise<void> {
  const to = order.user?.email
  if (!to) return

  const prefs = await getUserPreferences(order.user?.id)
  if (prefs && !prefs.orderUpdates) {
    console.log(`[OrderEmail] User disabled orderUpdates — skipping shipped email`)
    return
  }

  const html = getOrderShippedHTML(order, trackingNumber)
  await sendEmail(to, `Tu pedido fue despachado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

export async function sendOrderDeliveredEmail(order: OrderEmailData): Promise<void> {
  const to = order.user?.email
  if (!to) return

  const prefs = await getUserPreferences(order.user?.id)
  if (prefs && !prefs.orderUpdates) {
    console.log(`[OrderEmail] User disabled orderUpdates — skipping delivered email`)
    return
  }

  const html = getOrderDeliveredHTML(order)
  await sendEmail(to, `Pedido entregado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

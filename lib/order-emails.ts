import { sendEmail } from "@/lib/email"
import {
  getOrderConfirmationHTML,
  getOrderShippedHTML,
  getOrderDeliveredHTML,
  type OrderEmailData,
} from "@/lib/email-templates"

export type { OrderEmailData }

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<void> {
  const to = order.user?.email
  if (!to) {
    console.warn(`[OrderEmail] No user email on order ${order.id} — skipping confirmation`)
    return
  }

  const html = getOrderConfirmationHTML(order)
  await sendEmail(to, `Pedido confirmado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

export async function sendOrderShippedEmail(order: OrderEmailData, trackingNumber: string): Promise<void> {
  const to = order.user?.email
  if (!to) return

  const html = getOrderShippedHTML(order, trackingNumber)
  await sendEmail(to, `Tu pedido fue despachado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

export async function sendOrderDeliveredEmail(order: OrderEmailData): Promise<void> {
  const to = order.user?.email
  if (!to) return

  const html = getOrderDeliveredHTML(order)
  await sendEmail(to, `Pedido entregado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

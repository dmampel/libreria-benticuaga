import { sendEmail } from "@/lib/email"
import {
  getOrderConfirmationHTML,
  getOrderPreparingHTML,
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
  const to = order.user?.email ?? order.guestEmail ?? null
  if (!to) {
    console.warn(`[OrderEmail] No email on order ${order.id} — skipping confirmation`)
    return
  }

  // Registered users may have email preferences; guests always receive confirmations
  if (order.user?.id) {
    const prefs = await getUserPreferences(order.user.id)
    if (prefs && !prefs.orderConfirmation) {
      console.log(`[OrderEmail] User disabled orderConfirmation — skipping`)
      return
    }
  }

  const html = getOrderConfirmationHTML(order)
  await sendEmail(to, `Pedido confirmado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

export async function sendOrderConfirmationEmailWithInvoice(order: OrderEmailData): Promise<void> {
  const to = order.user?.email ?? order.guestEmail ?? null
  if (!to) {
    console.warn(`[OrderEmail] No email on order ${order.id} — skipping confirmation+invoice`)
    return
  }

  // Registered users may have email preferences; guests always receive confirmations
  if (order.user?.id) {
    const prefs = await getUserPreferences(order.user.id)
    if (prefs && !prefs.orderConfirmation) {
      console.log(`[OrderEmail] User disabled orderConfirmation — skipping`)
      return
    }
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

export async function sendOrderPreparingEmail(order: OrderEmailData): Promise<void> {
  const to = order.user?.email ?? order.guestEmail ?? null
  if (!to) return

  if (order.user?.id) {
    const prefs = await getUserPreferences(order.user.id)
    if (prefs && !prefs.orderUpdates) {
      console.log(`[OrderEmail] User disabled orderUpdates — skipping preparing email`)
      return
    }
  }

  const html = getOrderPreparingHTML(order)
  await sendEmail(to, `Tu pedido está siendo preparado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

export async function sendOrderShippedEmail(order: OrderEmailData, trackingNumber: string): Promise<void> {
  const to = order.user?.email ?? order.guestEmail ?? null
  if (!to) return

  if (order.user?.id) {
    const prefs = await getUserPreferences(order.user.id)
    if (prefs && !prefs.orderUpdates) {
      console.log(`[OrderEmail] User disabled orderUpdates — skipping shipped email`)
      return
    }
  }

  const html = getOrderShippedHTML(order, trackingNumber)
  await sendEmail(to, `Tu pedido fue despachado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

export async function sendNewOrderAdminNotification(order: OrderEmailData): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) {
    console.warn("[OrderEmail] ADMIN_NOTIFICATION_EMAIL not set — skipping admin notification")
    return
  }

  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
    : order.guestName ?? order.guestEmail ?? "Invitado"

  const itemRows = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${i.product.name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${i.quantity}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:right">$${i.price.toFixed(2)}</td>
        </tr>`
    )
    .join("")

  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/orders/${order.id}`

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1f2937">🛍️ Nuevo pedido recibido</h2>
      <p style="color:#6b7280">ID: <strong style="font-family:monospace">#${order.id.slice(0, 8).toUpperCase()}</strong></p>
      <p style="color:#6b7280">Cliente: <strong>${customerName}</strong></p>
      <p style="color:#6b7280">Total: <strong style="font-size:1.1em;color:#111827">$${order.total.toFixed(2)}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#9ca3af;text-transform:uppercase">Producto</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#9ca3af;text-transform:uppercase">Cant.</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#9ca3af;text-transform:uppercase">Precio</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <a href="${adminUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
        Ver pedido en el admin →
      </a>
    </div>
  `

  await sendEmail(adminEmail, `🛍️ Nuevo pedido #${order.id.slice(0, 8).toUpperCase()} — $${order.total.toFixed(2)}`, html)
}

export async function sendOrderDeliveredEmail(order: OrderEmailData): Promise<void> {
  const to = order.user?.email ?? order.guestEmail ?? null
  if (!to) return

  if (order.user?.id) {
    const prefs = await getUserPreferences(order.user.id)
    if (prefs && !prefs.orderUpdates) {
      console.log(`[OrderEmail] User disabled orderUpdates — skipping delivered email`)
      return
    }
  }

  const html = getOrderDeliveredHTML(order)
  await sendEmail(to, `Pedido entregado #${order.id.slice(0, 8).toUpperCase()} — Benticuaga`, html)
}

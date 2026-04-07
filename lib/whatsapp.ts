import type { Role } from "@prisma/client"
import { getPriceLabel } from "@/lib/pricing"

interface OrderLineItem {
  name: string
  quantity: number
  unitPrice: number
}

/**
 * Builds the pre-filled WhatsApp message body.
 */
export function generateWhatsAppMessage(
  items: OrderLineItem[],
  total: number,
  userRole: Role,
  orderId?: string
): string {
  const lines = items
    .map((i) => `- ${i.name} x${i.quantity} ($${(i.unitPrice * i.quantity).toFixed(2)})`)
    .join("\n")

  const roleLabel = getPriceLabel(userRole)
  const orderRef = orderId ? `\n🔖 Referencia: #${orderId.slice(0, 8).toUpperCase()}` : ""

  return (
    `Hola! Quisiera confirmar el siguiente pedido:\n\n` +
    `📦 PRODUCTOS:\n${lines}\n\n` +
    `💰 TOTAL: $${total.toFixed(2)} (${roleLabel})` +
    `${orderRef}\n\n` +
    `¿Puedo confirmar esta orden?`
  )
}

/**
 * Builds the wa.me deep link with the encoded message.
 * Reads the phone number from NEXT_PUBLIC_WHATSAPP_PHONE env var.
 */
export function getWhatsAppLink(message: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? ""
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

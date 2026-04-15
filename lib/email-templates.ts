// Types shared across order email templates

export interface OrderItemData {
  quantity: number
  price: number
  product: { id: string; name: string }
}

export interface OrderEmailData {
  id: string
  total: number
  createdAt: Date | string
  shippingAddress: string | null
  trackingNumber: string | null
  items: OrderItemData[]
  user: { id?: string; email: string; firstName: string | null; lastName: string | null } | null
  // Guest checkout fields — present when user is null
  guestEmail?: string | null
  guestName?: string | null
}

// ============ Shared helpers ============

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
}

function greeting(order: Pick<OrderEmailData, "user" | "guestName">) {
  if (order.user?.firstName) return `Hola ${order.user.firstName}`
  if (order.guestName) return `Hola ${order.guestName}`
  return "Hola"
}

const BASE_STYLE = `
  body { margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
`

function itemsTable(items: OrderItemData[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">
          ${item.product.name}
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #6b7280; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; text-align: right;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("")

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 10px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; text-align: left;">Producto</th>
          <th style="padding: 10px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; text-align: center;">Cant.</th>
          <th style="padding: 10px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #111827; text-align: right;">Total</td>
          <td style="padding: 12px 16px; font-size: 16px; font-weight: 700; color: #4f46e5; text-align: right;">
            ${formatCurrency(items.reduce((s, i) => s + i.price * i.quantity, 0))}
          </td>
        </tr>
      </tfoot>
    </table>`
}

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${BASE_STYLE}</style></head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: #4f46e5; padding: 24px 32px;">
              <p style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">Librería Benticuaga</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Librería Benticuaga · Mendoza, Argentina
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============ Templates ============

export function getOrderConfirmationHTML(order: OrderEmailData): string {
  return wrapper(`
    <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #111827;">${greeting(order)}, ¡recibimos tu pedido!</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">Tu pago fue confirmado. Estamos preparando tu pedido.</p>

    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Número de pedido</p>
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; font-family: monospace;">${order.id.slice(0, 8).toUpperCase()}</p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af;">${formatDate(order.createdAt)}</p>
    </div>

    ${itemsTable(order.items)}

    ${order.shippingAddress ? `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Dirección de envío</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">${order.shippingAddress}</p>
    </div>` : ""}

    <p style="margin: 0; font-size: 14px; color: #6b7280;">Te avisaremos cuando tu pedido sea despachado. ¡Gracias por tu compra!</p>
  `)
}

export function getOrderPreparingHTML(order: OrderEmailData): string {
  return wrapper(`
    <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #111827;">${greeting(order)}, ¡tu pedido está siendo preparado!</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">Aceptamos tu pedido y ya estamos preparándolo. Te avisaremos cuando sea despachado.</p>

    <div style="background: #fff7ed; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #f97316;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9a3412;">En preparación</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #c2410c;">${formatDate(new Date())}</p>
    </div>

    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Número de pedido</p>
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; font-family: monospace;">${order.id.slice(0, 8).toUpperCase()}</p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af;">${formatDate(order.createdAt)}</p>
    </div>

    ${itemsTable(order.items)}

    ${order.shippingAddress ? `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Dirección de envío</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">${order.shippingAddress}</p>
    </div>` : ""}

    <p style="margin: 0; font-size: 14px; color: #6b7280;">¡Gracias por tu compra en Librería Benticuaga!</p>
  `)
}

export function getOrderShippedHTML(order: OrderEmailData, trackingNumber: string): string {
  return wrapper(`
    <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #111827;">${greeting(order)}, ¡tu pedido fue despachado!</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">Tu pedido está en camino.</p>

    <div style="background: #eef2ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Número de seguimiento</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #4f46e5; font-family: monospace;">${trackingNumber}</p>
    </div>

    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Número de pedido</p>
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; font-family: monospace;">${order.id.slice(0, 8).toUpperCase()}</p>
    </div>

    ${itemsTable(order.items)}

    ${order.shippingAddress ? `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Dirección de entrega</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">${order.shippingAddress}</p>
    </div>` : ""}

    <p style="margin: 0; font-size: 14px; color: #6b7280;">Usá el número de seguimiento para rastrear tu envío.</p>
  `)
}

export function getOrderDeliveredHTML(order: OrderEmailData): string {
  return wrapper(`
    <p style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #111827;">${greeting(order)}, ¡tu pedido fue entregado!</p>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">Esperamos que estés disfrutando tu compra.</p>

    <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #166534;">Pedido entregado</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #15803d;">${formatDate(new Date())}</p>
    </div>

    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Número de pedido</p>
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; font-family: monospace;">${order.id.slice(0, 8).toUpperCase()}</p>
    </div>

    ${itemsTable(order.items)}

    <p style="margin: 0; font-size: 14px; color: #6b7280;">¡Gracias por elegir Librería Benticuaga! Si tenés alguna consulta no dudes en contactarnos.</p>
  `)
}

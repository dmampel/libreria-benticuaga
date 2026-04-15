"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { id: string; name: string; image: string }
}

interface OrderUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  role: string
  cuit: string | null
  razonSocial: string | null
}

interface Order {
  id: string
  total: number
  status: string
  userRole: string
  paymentMethod: string | null
  transactionId: string | null
  shippingAddress: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  notes: string | null
  createdAt: string
  user: OrderUser | null
  guestEmail: string | null
  guestPhone: string | null
  guestName: string | null
  items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Pago confirmado", className: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "En preparación", className: "bg-orange-100 text-orange-700" },
  SHIPPED: { label: "Enviado", className: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Entregado", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-600" },
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}


export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuth()
  const detailsRef = useRef<HTMLDetailsElement>(null)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
  const [status, setStatus] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!token || !id) return
    fetch(`/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const o: Order = data.data
          setOrder(o)
          setStatus(o.status)
          setShippingAddress(o.shippingAddress ?? "")
          setTrackingNumber(o.trackingNumber ?? "")
          setNotes(o.notes ?? "")
        }
      })
      .finally(() => setLoading(false))
  }, [token, id])

  async function handleQuickAction(nextStatus: string) {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus(nextStatus)
        setOrder((prev) => prev ? { ...prev, ...data.data } : prev)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!token) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shippingAddress: shippingAddress || null,
          trackingNumber: trackingNumber || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOrder((prev) => prev ? { ...prev, ...data.data } : prev)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-gray-400">
        <p>Pedido no encontrado</p>
        <Link href="/admin/orders" className="text-sm text-indigo-600 hover:underline">Volver a pedidos</Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-600" }
  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
    : "Invitado"

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-lg font-bold text-gray-900">#{order.id.slice(0, 8)}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Items */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-700">Productos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3 text-right">Precio</th>
                    <th className="px-6 py-3 text-right">Cant.</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 font-medium text-gray-800">{item.product.name}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{formatCurrency(item.price)}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50/50">
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Envío</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500">Dirección</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Dirección de envío"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">N° de seguimiento</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Tracking number"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">Fecha de envío</p>
                <p className="text-sm text-gray-700">{formatDateTime(order.shippedAt)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">Fecha de entrega</p>
                <p className="text-sm text-gray-700">{formatDateTime(order.deliveredAt)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Notas internas</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notas visibles solo para admins…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* Save shipping + notes */}
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-emerald-600">✓ Guardado</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Estado del pedido</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>

            {status === "PENDING" && (
              <div className="flex flex-col gap-2">
                <p className="text-center text-xs text-gray-400">Esperando pago de Mercado Pago</p>
                <button
                  onClick={() => handleQuickAction("CANCELLED")}
                  disabled={saving}
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  ✕ Cancelar pedido
                </button>
              </div>
            )}
            {status === "CONFIRMED" && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleQuickAction("PREPARING")}
                  disabled={saving}
                  className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  ✓ Aceptar y preparar
                </button>
                <button
                  onClick={() => handleQuickAction("CANCELLED")}
                  disabled={saving}
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  ✕ Cancelar pedido
                </button>
              </div>
            )}
            {status === "PREPARING" && (
              <button
                onClick={() => handleQuickAction("SHIPPED")}
                disabled={saving}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                🚚 Marcar como enviado
              </button>
            )}
            {status === "SHIPPED" && (
              <button
                onClick={() => handleQuickAction("DELIVERED")}
                disabled={saving}
                className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                ✓ Marcar como entregado
              </button>
            )}
            {(status === "DELIVERED" || status === "CANCELLED") && (
              <p className="text-center text-xs text-gray-400">
                {status === "DELIVERED" ? "Pedido completado" : "Pedido cancelado"}
              </p>
            )}

            <div className="mt-4 border-t border-gray-100 pt-4">
              <details className="group" ref={detailsRef}>
                <summary className="cursor-pointer text-xs font-medium text-gray-400 transition-colors hover:text-indigo-600">
                  Forzar estado (Avanzado)
                </summary>
                <div className="mt-3">
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                    value={status}
                    onChange={(e) => {
                      handleQuickAction(e.target.value)
                      detailsRef.current?.removeAttribute("open")
                    }}
                    disabled={saving}
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Pago confirmado</option>
                    <option value="PREPARING">En preparación</option>
                    <option value="SHIPPED">Enviado</option>
                    <option value="DELIVERED">Entregado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </details>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Cliente</h2>
            {order.user ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Nombre</dt>
                  <dd className="font-medium text-gray-800">{customerName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Email</dt>
                  <dd className="text-gray-700">{order.user.email}</dd>
                </div>
                {order.user.phone && (
                  <div>
                    <dt className="text-xs text-gray-400">Teléfono</dt>
                    <dd className="text-gray-700">{order.user.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400">Tipo</dt>
                  <dd>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.user.role === "WHOLESALE" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {order.user.role === "WHOLESALE" ? "Mayorista" : "Minorista"}
                    </span>
                  </dd>
                </div>
                {order.user.role === "WHOLESALE" && order.user.razonSocial && (
                  <div>
                    <dt className="text-xs text-gray-400">Razón social</dt>
                    <dd className="text-gray-700">{order.user.razonSocial}</dd>
                  </div>
                )}
                <div className="pt-1">
                  <Link href={`/admin/users/${order.user.id}`} className="text-xs text-indigo-600 hover:underline">
                    Ver perfil completo →
                  </Link>
                </div>
              </dl>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="mb-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Invitado
                  </span>
                </div>
                {order.guestName && (
                  <div>
                    <dt className="text-xs text-gray-400">Nombre</dt>
                    <dd className="font-medium text-gray-800">{order.guestName}</dd>
                  </div>
                )}
                {order.guestEmail && (
                  <div>
                    <dt className="text-xs text-gray-400">Email</dt>
                    <dd className="text-gray-700">{order.guestEmail}</dd>
                  </div>
                )}
                {order.guestPhone && (
                  <div>
                    <dt className="text-xs text-gray-400">Teléfono</dt>
                    <dd className="text-gray-700">{order.guestPhone}</dd>
                  </div>
                )}
                {order.shippingAddress && (
                  <div>
                    <dt className="text-xs text-gray-400">Dirección</dt>
                    <dd className="text-gray-700">{order.shippingAddress}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Pago</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-gray-400">Método</dt>
                <dd className="font-medium text-gray-800">
                  {order.paymentMethod === "MERCADO_PAGO"
                    ? "Mercado Pago"
                    : order.paymentMethod === "WHATSAPP"
                    ? "WhatsApp"
                    : "—"}
                </dd>
              </div>
              {order.transactionId && (
                <div>
                  <dt className="text-xs text-gray-400">ID transacción</dt>
                  <dd className="font-mono text-xs text-gray-600">{order.transactionId}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400">Precio aplicado</dt>
                <dd className="text-gray-700">
                  {order.userRole === "WHOLESALE" ? "Mayorista" : "Minorista"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

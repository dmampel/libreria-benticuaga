"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { id: string; name: string; image: string }
}

interface Order {
  id: string
  total: number
  status: string
  userRole: string
  paymentMethod: string | null
  transactionId: string | null
  createdAt: string
  items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Pago confirmado", className: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "En preparación", className: "bg-orange-100 text-orange-700" },
  SHIPPED: { label: "Enviado", className: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Entregado", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", className: "bg-gray-100 text-gray-500" },
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !id) return
    fetch(`/api/account/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.data)
        } else {
          setError(data.error ?? "Pedido no encontrado")
        }
      })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false))
  }, [token, id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-sm font-medium text-gray-500">{error ?? "Pedido no encontrado"}</p>
        <Link href="/account/orders" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          Volver a Mis Pedidos
        </Link>
      </div>
    )
  }

  const status = STATUS_CONFIG[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-500" }
  const date = new Date(order.createdAt).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/account/orders"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver a Mis Pedidos
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-gray-400">Pedido #{order.id.slice(0, 8)}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</h1>
          <p className="mt-0.5 text-sm text-gray-500 capitalize">{date}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Order details */}
      <div className="space-y-4">
        {/* Items table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3 text-center">Cant.</th>
                <th className="px-5 py-3 text-right">P. Unit.</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-400">#{item.product.id}</p>
                  </td>
                  <td className="px-5 py-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="px-5 py-4 text-right text-gray-600">${item.price.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-100 bg-gray-50">
                <td colSpan={3} className="px-5 py-4 text-right text-sm font-semibold text-gray-700">
                  Total
                </td>
                <td className="px-5 py-4 text-right text-lg font-bold text-gray-900">
                  ${order.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Metadata */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Detalles del pedido
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500">ID completo</dt>
              <dd className="mt-0.5 font-mono text-xs text-gray-700 break-all">{order.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Precio aplicado</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {order.userRole === "WHOLESALE" ? "Mayorista" : "Minorista"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Estado</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Método de pago</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {order.paymentMethod === "MERCADO_PAGO"
                  ? "Mercado Pago"
                  : order.paymentMethod === "WHATSAPP"
                  ? "WhatsApp"
                  : "—"}
              </dd>
            </div>
            {order.transactionId && (
              <div className="col-span-2">
                <dt className="text-xs text-gray-500">ID de transacción</dt>
                <dd className="mt-0.5 font-mono text-xs text-gray-700">{order.transactionId}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

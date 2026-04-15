"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string }
}

interface Order {
  id: string
  total: number
  status: string
  userRole: string
  createdAt: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Pago confirmado", className: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "En preparación", className: "bg-orange-100 text-orange-700" },
  SHIPPED: { label: "Enviado", className: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Entregado", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", className: "bg-gray-100 text-gray-500" },
}

export default function OrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch("/api/account/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data)
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/account"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="mt-0.5 text-sm text-gray-500">{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</p>
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-500">No tenés pedidos aún</p>
          <p className="mt-1 text-xs text-gray-400">Tus compras aparecerán aquí</p>
          <Link
            href="/products"
            className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Ver productos
          </Link>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-500" }
            const date = new Date(order.createdAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {order.items.length} {order.items.length === 1 ? "producto" : "productos"} · {date}
                  </p>
                </div>
                <svg className="ml-4 h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

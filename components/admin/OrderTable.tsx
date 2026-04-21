"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export interface OrderRow {
  id: string
  total: number
  status: string
  deliveryType: "DELIVERY" | "PICKUP"
  createdAt: string
  user: { email: string; firstName: string | null; lastName: string | null } | null
  guestEmail: string | null
  guestName: string | null
  items: { id: string }[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Pago confirmado", className: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "En preparación", className: "bg-orange-100 text-orange-700" },
  SHIPPED: { label: "Enviado", className: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Entregado", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-600" },
}

type SortKey = "createdAt" | "total" | "status"
type SortDir = "asc" | "desc"

const PAGE_SIZE = 10

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
}

function customerLabel(order: OrderRow): { name: string; isGuest: boolean } {
  if (order.user) {
    const name = [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
    return { name, isGuest: false }
  }
  return { name: order.guestName ?? order.guestEmail ?? "Invitado", isGuest: true }
}

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(0)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
    setPage(0)
  }

  const sorted = [...orders].sort((a, b) => {
    let cmp = 0
    if (sortKey === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt)
    if (sortKey === "total") cmp = a.total - b.total
    if (sortKey === "status") cmp = a.status.localeCompare(b.status)
    return sortDir === "asc" ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1 text-indigo-500">{sortDir === "asc" ? "↑" : "↓"}</span>
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Entrega</th>
              <th
                className="cursor-pointer px-6 py-3 hover:text-gray-600"
                onClick={() => toggleSort("total")}
              >
                Total <SortIcon k="total" />
              </th>
              <th
                className="cursor-pointer px-6 py-3 hover:text-gray-600"
                onClick={() => toggleSort("status")}
              >
                Estado <SortIcon k="status" />
              </th>
              <th
                className="cursor-pointer px-6 py-3 hover:text-gray-600"
                onClick={() => toggleSort("createdAt")}
              >
                Fecha <SortIcon k="createdAt" />
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                  Sin pedidos
                </td>
              </tr>
            )}
            {visible.map((order) => {
              const status = STATUS_CONFIG[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-600" }
              return (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="cursor-pointer hover:bg-indigo-50/40"
                >
                  <td className="px-6 py-3 font-mono text-xs text-indigo-600">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-3">
                    {(() => {
                      const { name, isGuest } = customerLabel(order)
                      return (
                        <span className="flex items-center gap-2">
                          <span className="text-gray-700">{name}</span>
                          {isGuest && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Invitado
                            </span>
                          )}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-3">
                    {order.deliveryType === "DELIVERY" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        🚚 Envío
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                        🏪 Retiro
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/orders/${order.id}`)
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Ver pedido →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

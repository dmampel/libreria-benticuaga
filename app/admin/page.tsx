"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { StatCard } from "@/components/admin/StatCard"
import { useAuth } from "@/lib/hooks/useAuth"

interface TopProduct {
  productId: string
  name: string
  orderCount: number
}

interface RecentOrder {
  id: string
  total: number
  status: string
  createdAt: string
  guestName: string | null
  guestEmail: string | null
  user: { email: string; firstName: string | null; lastName: string | null } | null
}

interface RevenueDay {
  date: string
  revenue: number
}

interface OrdersByStatus {
  pending: number
  confirmed: number
  preparing: number
  shipped: number
  delivered: number
  cancelled: number
}

const EMPTY_STATUS: OrdersByStatus = { pending: 0, confirmed: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 }

interface Stats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  ordersThisMonth: number
  revenueThisMonth: number
  ordersByStatus?: OrdersByStatus
  topProducts: TopProduct[]
  recentOrders: RecentOrder[]
  revenueByDay: RevenueDay[]
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Pago confirmado", className: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "En preparación", className: "bg-orange-100 text-orange-700" },
  SHIPPED: { label: "Enviado", className: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Entregado", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-700" },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "ahora"
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}

export default function AdminDashboardPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data)
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

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-400">
        Error al cargar estadísticas
      </div>
    )
  }

  const pendingCount = stats.ordersByStatus?.pending ?? 0
  const pendingOrders = stats.recentOrders.filter((o) => o.status === "PENDING")

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen general del negocio</p>
      </div>

      {/* Pending Orders Alert */}
      {pendingCount > 0 && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          {/* Header row */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Bell icon with pulse */}
              <div className="relative flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-900">
                  {pendingCount} pedido{pendingCount !== 1 ? "s" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
                </h2>
                <p className="text-xs text-amber-600">Esperando confirmación</p>
              </div>
            </div>
            <a
              href="/admin/orders?status=PENDING"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Ver todos →
            </a>
          </div>

          {/* Recent pending orders */}
          {pendingOrders.length > 0 && (
            <div className="border-t border-amber-200/70 divide-y divide-amber-100">
              {pendingOrders.slice(0, 3).map((order) => {
                const name = order.user
                  ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
                  : order.guestName ?? order.guestEmail ?? "Invitado"
                return (
                  <a
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-amber-100/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-amber-500 flex-shrink-0">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="truncate text-sm font-medium text-amber-900">{name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <span className="text-sm font-bold text-amber-900">{formatCurrency(order.total)}</span>
                      <span className="text-xs text-amber-500 w-20 text-right">{timeAgo(order.createdAt)}</span>
                      <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pedidos totales"
          value={stats.totalOrders}
          trend={{ label: `${stats.ordersThisMonth} este mes`, positive: stats.ordersThisMonth > 0 }}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Ingresos totales"
          value={formatCurrency(stats.totalRevenue)}
          trend={{ label: `${formatCurrency(stats.revenueThisMonth)} este mes`, positive: stats.revenueThisMonth > 0 }}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Clientes"
          value={stats.totalCustomers}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Productos"
          value={stats.totalProducts}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          }
        />
      </div>

      {/* Order Pipeline */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Pendientes", count: (stats.ordersByStatus ?? EMPTY_STATUS).pending, color: "bg-yellow-50 border-yellow-200 text-yellow-700", dot: "bg-yellow-400", href: "/admin/orders?status=PENDING" },
          { label: "Pago confirmado", count: (stats.ordersByStatus ?? EMPTY_STATUS).confirmed, color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-400", href: "/admin/orders?status=CONFIRMED" },
          { label: "En preparación", count: (stats.ordersByStatus ?? EMPTY_STATUS).preparing, color: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-400", href: "/admin/orders?status=PREPARING" },
          { label: "Enviados", count: (stats.ordersByStatus ?? EMPTY_STATUS).shipped, color: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-400", href: "/admin/orders?status=SHIPPED" },
          { label: "Entregados", count: (stats.ordersByStatus ?? EMPTY_STATUS).delivered, color: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-400", href: "/admin/orders?status=DELIVERED" },
          { label: "Cancelados", count: (stats.ordersByStatus ?? EMPTY_STATUS).cancelled, color: "bg-gray-50 border-gray-200 text-gray-500", dot: "bg-gray-300", href: "/admin/orders?status=CANCELLED" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-opacity hover:opacity-80 ${item.color}`}
          >
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${item.dot}`} />
            <div>
              <p className="text-xl font-bold leading-none">{item.count}</p>
              <p className="mt-0.5 text-xs font-medium opacity-80">{item.label}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Ingresos — últimos 30 días</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.revenueByDay} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                width={50}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), "Ingresos"]}
                labelFormatter={(l) => formatDate(l)}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Top productos</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <ul className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-gray-700">{p.name}</span>
                  <span className="text-sm font-medium text-gray-500">{p.orderCount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-700">Pedidos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.slice(0, 5).map((order) => {
                const status = STATUS_LABELS[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-600" }
                const customerName = order.user
                  ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email
                  : "Invitado"
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-400">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-3 text-gray-700">{customerName}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {stats.recentOrders.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Sin pedidos aún</p>
          )}
        </div>
      </div>
    </div>
  )
}

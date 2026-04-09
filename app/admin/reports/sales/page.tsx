"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

interface DataPoint {
  date: string
  orders: number
  revenue: number
}

interface Summary {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  from: string
  to: string
}

import { formatCurrency } from "@/lib/constants"

function formatDate(s: string) {
  // s is YYYY-MM-DD or YYYY-MM
  const parts = s.split("-")
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`
  return new Date(s + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
}

export default function SalesReportPage() {
  const { token } = useAuth()
  const [data, setData] = useState<DataPoint[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("daily")
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ period, from, to })
    fetch(`/api/admin/stats/sales?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setData(d.data)
          setSummary(d.summary)
        }
      })
      .finally(() => setLoading(false))
  }, [token, period, from, to])

  useEffect(() => { load() }, [load])

  function exportCsv() {
    const header = "Fecha,Órdenes,Ingresos"
    const rows = data.map((d) => `${d.date},${d.orders},${d.revenue.toFixed(2)}`)
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ventas_${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Ventas</h1>
          <p className="mt-1 text-sm text-gray-500">Tendencia de ingresos y órdenes</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={data.length === 0}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                period === p ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p === "daily" ? "Diario" : p === "weekly" ? "Semanal" : "Mensual"}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
        <span className="text-sm text-gray-400">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Ingresos totales", value: formatCurrency(summary.totalRevenue), sub: "en el período" },
            { label: "Órdenes", value: summary.totalOrders.toString(), sub: "no canceladas" },
            { label: "Ticket promedio", value: formatCurrency(summary.avgOrderValue), sub: "por orden" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-medium text-gray-400">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="mt-0.5 text-xs text-gray-400">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
             <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
             <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
             <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      ) : (
        <>
          {/* Revenue line chart */}
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Ingresos</h2>
            {data.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Sin datos para el período seleccionado</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), "Ingresos"]}
                    labelFormatter={(label) => formatDate(String(label))}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Orders bar chart */}
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Órdenes</h2>
            {data.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Sin datos para el período seleccionado</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, "Órdenes"]} labelFormatter={(label) => formatDate(String(label))} />
                  <Bar dataKey="orders" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table */}
          {data.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-gray-700">Desglose por período</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                      <th className="px-6 py-3">Período</th>
                      <th className="px-6 py-3 text-right">Órdenes</th>
                      <th className="px-6 py-3 text-right">Ingresos</th>
                      <th className="px-6 py-3 text-right">Ticket promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...data].reverse().map((row) => (
                      <tr key={row.date} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-mono text-xs text-gray-600">{row.date}</td>
                        <td className="px-6 py-3 text-right text-gray-700">{row.orders}</td>
                        <td className="px-6 py-3 text-right font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                        <td className="px-6 py-3 text-right text-gray-500">
                          {row.orders > 0 ? formatCurrency(row.revenue / row.orders) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

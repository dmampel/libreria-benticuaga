"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/hooks/useAuth"

interface LogEntry {
  id: string
  adminId: string
  action: string
  entityId: string | null
  details: string | null
  createdAt: string
  admin: { id: string; email: string }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

import { ACTION_LABELS, ACTION_COLORS } from "@/lib/constants"

function parseDetails(details: string | null): string {
  if (!details) return ""
  try {
    const obj = JSON.parse(details)
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ")
  } catch {
    return details
  }
}

export default function ActivityLogPage() {
  const { token } = useAuth()
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString() })
    if (actionFilter) params.set("action", actionFilter)
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    fetch(`/api/admin/activity-log?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEntries(d.data)
          setMeta(d.meta)
        }
      })
      .finally(() => setLoading(false))
  }, [token, page, actionFilter, from, to])

  useEffect(() => { load() }, [load])

  function handleFilterChange(setter: (v: string) => void, val: string) {
    setter(val)
    setPage(1)
  }

  function formatDateTime(s: string) {
    return new Date(s).toLocaleString("es-AR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Log de Actividad</h1>
        <p className="mt-1 text-sm text-gray-500">Auditoría de acciones administrativas</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => handleFilterChange(setFrom, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
        <span className="text-sm text-gray-400">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => handleFilterChange(setTo, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
        {(actionFilter || from || to) && (
          <button
            onClick={() => { setActionFilter(""); setFrom(""); setTo(""); setPage(1) }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading && entries.length === 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
           <div className="divide-y divide-gray-50">
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="flex items-center justify-between p-4">
                 <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                 <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                 <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                 <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
               </div>
             ))}
           </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Fecha / Hora</th>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-6 py-3">Acción</th>
                  <th className="px-6 py-3">Entidad</th>
                  <th className="px-6 py-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      Sin registros
                    </td>
                  </tr>
                )}
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600 font-medium">
                      {entry.admin.email}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-600"}`}>
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-400">
                      {entry.entityId ? entry.entityId.slice(0, 12) + "…" : "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {parseDetails(entry.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-gray-400">
                {meta.total} registros · página {meta.page} de {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

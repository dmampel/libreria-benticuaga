"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"

interface User {
  id: string
  email: string
  role: "RETAIL" | "WHOLESALE"
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  _count: { orders: number }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [adminFilter, setAdminFilter] = useState("")
  const [activeFilter, setActiveFilter] = useState("")
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; newValue: boolean } | null>(null)
  const [successMsg, setSuccessMsg] = useState("")

  const showToast = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (roleFilter) params.set("role", roleFilter)
    if (adminFilter) params.set("isAdmin", adminFilter)
    if (activeFilter) params.set("isActive", activeFilter)
    params.set("page", page.toString())

    fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUsers(d.data)
          setMeta(d.meta)
        }
      })
      .finally(() => setLoading(false))
  }, [token, search, roleFilter, adminFilter, activeFilter, page])

  async function handleToggleAdmin(id: string, newValue: boolean) {
    if (!token) return
    setTogglingId(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isAdmin: newValue }),
    })
    const data = await res.json()
    if (data.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isAdmin: newValue } : u))
      )
      showToast("Permisos actualizados")
    }
    setTogglingId(null)
    setConfirmToggle(null)
  }

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    setter(val)
    setPage(1)
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="mt-1 text-sm text-gray-500">{users.length} usuario(s)</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por email…"
          value={search}
          onChange={(e) => handleFilterChange(setSearch, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => handleFilterChange(setRoleFilter, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Todos los roles</option>
          <option value="RETAIL">Minorista</option>
          <option value="WHOLESALE">Mayorista</option>
        </select>
        <select
          value={adminFilter}
          onChange={(e) => handleFilterChange(setAdminFilter, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Todos</option>
          <option value="true">Solo admins</option>
          <option value="false">No admins</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => handleFilterChange(setActiveFilter, e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Todos los Estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        {(search || roleFilter || adminFilter || activeFilter) && (
          <button
            onClick={() => { setSearch(""); setRoleFilter(""); setAdminFilter(""); setActiveFilter(""); setPage(1) }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {successMsg && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
          {successMsg}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-6">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3 text-center">Admin</th>
                <th className="px-6 py-3 text-right">Pedidos</th>
                <th className="px-6 py-3">Registrado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    Sin usuarios
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50/50 ${!user.isActive ? "bg-gray-50 opacity-75" : ""}`}>
                  <td className="px-6 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                       {user.email}
                       {!user.isActive && (
                         <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">INACTIVO</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "WHOLESALE"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.role === "WHOLESALE" ? "Mayorista" : "Minorista"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {confirmToggle?.id === user.id ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleAdmin(user.id, confirmToggle.newValue)}
                          disabled={togglingId === user.id}
                          className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmToggle(null)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmToggle({ id: user.id, newValue: !user.isAdmin })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          user.isAdmin ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            user.isAdmin ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-500">{user._count.orders}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-3">
              <span className="text-xs text-gray-500">
                Página {meta.page} de {meta.totalPages} (Total: {meta.total})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

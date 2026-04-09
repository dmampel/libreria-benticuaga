"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  _count: { items: number }
}

interface UserDetail {
  id: string
  email: string
  role: "RETAIL" | "WHOLESALE"
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  orders: Order[]
}

import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuth()
  const id = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAdmin, setConfirmAdmin] = useState(false)
  const [confirmActive, setConfirmActive] = useState(false)
  const [confirmRole, setConfirmRole] = useState<"RETAIL" | "WHOLESALE" | null>(null)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const showToast = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  useEffect(() => {
    if (!token) return
    fetch(`/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.data)
        else setError(d.error)
      })
      .finally(() => setLoading(false))
  }, [id, token])

  async function handleToggleAdmin() {
    if (!token || !user) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isAdmin: !user.isAdmin }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setUser((prev) => prev ? { ...prev, isAdmin: data.data.isAdmin } : prev)
      showToast(data.data.isAdmin ? "Acceso admin concedido" : "Acceso admin revocado")
    } else {
      setError(data.error)
    }
    setConfirmAdmin(false)
  }

  async function handleToggleActive() {
    if (!token || !user) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setUser((prev) => prev ? { ...prev, isActive: data.data.isActive } : prev)
      showToast(data.data.isActive ? "Usuario reactivado" : "Usuario suspendido")
    } else {
      setError(data.error)
    }
    setConfirmActive(false)
  }

  async function handleRoleChange() {
    if (!token || !user || !confirmRole) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: confirmRole }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setUser((prev) => prev ? { ...prev, role: data.data.role } : prev)
      showToast("Rol de usuario actualizado")
    } else {
      setError(data.error)
    }
    setConfirmRole(null)
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
          <div className="lg:col-span-2 h-96 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-sm text-gray-500">Usuario no encontrado.</div>
    )
  }

  const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/users")}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900 truncate">{user.email}</h1>
      </div>

      {successMsg && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: user info */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Perfil</h2>

            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800">{user.email}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Rol</p>
              <div className="flex items-center gap-2">
                <select
                  value={confirmRole || user.role}
                  onChange={(e) => setConfirmRole(e.target.value as "RETAIL" | "WHOLESALE")}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:opacity-60"
                >
                  <option value="RETAIL">Minorista</option>
                  <option value="WHOLESALE">Mayorista</option>
                </select>
                {confirmRole && confirmRole !== user.role && (
                  <button
                    onClick={handleRoleChange}
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    Guardar
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400">Registrado</p>
              <p className="text-sm text-gray-600">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Acceso admin</h2>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  user.isAdmin ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {user.isAdmin ? "Admin activo" : "Sin acceso admin"}
              </span>
            </div>
            {confirmAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleAdmin}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmAdmin(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmAdmin(true)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  user.isAdmin
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                {user.isAdmin ? "Quitar acceso admin" : "Dar acceso admin"}
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Estado de Cuenta</h2>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {user.isActive ? "Cuenta Activa" : "Cuenta Suspendida"}
              </span>
            </div>
            {confirmActive ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleActive}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmActive(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmActive(true)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  user.isActive
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-green-200 text-green-600 hover:bg-green-50"
                }`}
              >
                {user.isActive ? "Suspender Usuario" : "Reactivar Usuario"}
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Resumen</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-400">Pedidos</p>
                <p className="text-xl font-bold text-gray-900">{user.orders.length}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-400">Total gastado</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: orders */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-700">Últimos pedidos</h2>
            </div>
            {user.orders.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-400">Sin pedidos</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Items</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {user.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-500">{order._count.items}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-800">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

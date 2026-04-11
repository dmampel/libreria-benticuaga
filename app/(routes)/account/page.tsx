"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"

interface UserProfile {
  id: string
  email: string
  role: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  cuit: string | null
  razonSocial: string | null
  createdAt: string
}

export default function AccountPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProfile(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    router.push("/products")
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    )
  }

  if (!profile) return null

  const isWholesale = profile.role === "WHOLESALE"
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—"

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">Información de tu perfil</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>

      <div className="space-y-6">
        {/* Personal info */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Datos personales
            </h2>
            <button
              disabled
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 disabled:cursor-not-allowed"
              title="Próximamente"
            >
              Editar Perfil
            </button>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Nombre completo</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{fullName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Dirección</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Tipo de cuenta</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isWholesale
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isWholesale ? "Mayorista" : "Minorista"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Miembro desde</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </section>

        {/* Wholesale info */}
        {isWholesale && (
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-500">
              Datos de empresa
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Razón Social</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{profile.razonSocial ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">CUIT</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.cuit ?? "—"}</dd>
              </div>
            </dl>
          </section>
        )}

        {/* Orders link */}
        <Link
          href="/account/orders"
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Mis Pedidos</p>
              <p className="text-xs text-gray-500">Historial de tus compras</p>
            </div>
          </div>
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Email preferences link */}
        <Link
          href="/account/email-preferences"
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Preferencias de Email</p>
              <p className="text-xs text-gray-500">Elegí qué notificaciones recibir</p>
            </div>
          </div>
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

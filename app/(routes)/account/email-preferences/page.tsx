"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Preferences {
  orderConfirmation: boolean
  orderUpdates: boolean
  promotions: boolean
  newsletter: boolean
}

const PREFERENCE_ITEMS: { key: keyof Preferences; label: string; description: string; locked?: boolean }[] = [
  {
    key: "orderConfirmation",
    label: "Confirmación de pedido",
    description: "Recibí un email con tu factura cuando se confirme el pago.",
  },
  {
    key: "orderUpdates",
    label: "Estado del pedido",
    description: "Notificaciones cuando tu pedido sea despachado o entregado.",
  },
  {
    key: "promotions",
    label: "Promociones",
    description: "Ofertas especiales y descuentos exclusivos.",
  },
  {
    key: "newsletter",
    label: "Newsletter",
    description: "Novedades y contenido de la librería.",
  },
]

export default function EmailPreferencesPage() {
  const router = useRouter()
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/account/email-preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPrefs(data.data)
        else router.push("/auth/login")
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false))
  }, [router])

  async function handleSave() {
    if (!prefs) return
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch("/api/account/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      const data = await res.json()
      if (data.success) {
        setPrefs(data.data)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  function toggle(key: keyof Preferences) {
    setPrefs((prev) => prev && { ...prev, [key]: !prev[key] })
    setSaved(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    )
  }

  if (!prefs) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Mi Cuenta
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Preferencias de Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Elegí qué emails querés recibir. Los emails de verificación y recuperación de contraseña siempre se envían.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {PREFERENCE_ITEMS.map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[item.key]}
                onClick={() => toggle(item.key)}
                className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  prefs[item.key] ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    prefs[item.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          {saved ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Guardado
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar preferencias"}
          </button>
        </div>
      </div>
    </div>
  )
}

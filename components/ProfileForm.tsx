"use client"

import { useState } from "react"
import { useToast } from "@/context/ToastContext"

export interface FullProfile {
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

interface Props {
  currentPhone?: string
  currentAddress?: string
  onComplete: (profile: FullProfile) => void
}

/**
 * ProfileForm — inline checkout guard.
 * Shown when the user hasn't provided phone + address yet.
 * Submits PATCH /api/account/profile (auth via cookie).
 */
export default function ProfileForm({ currentPhone = "", currentAddress = "", onComplete }: Props) {
  const { showToast } = useToast()
  const [phone, setPhone] = useState(currentPhone)
  const [address, setAddress] = useState(currentAddress)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? "Error al guardar. Intentá de nuevo.")
        return
      }

      showToast("Perfil actualizado ✓", "success")
      onComplete(data.data as FullProfile)
    } catch {
      setError("Error de conexión. Verificá tu internet e intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-100/60 px-5 py-4">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Completá tu perfil para continuar
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Necesitamos tu teléfono y dirección para gestionar tu pedido.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Phone */}
          <div className="flex-1">
            <label htmlFor="profile-phone" className="mb-1.5 block text-xs font-semibold text-gray-700">
              Teléfono
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 1234 5678"
              required
              minLength={10}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Address */}
          <div className="flex-[2]">
            <label htmlFor="profile-address" className="mb-1.5 block text-xs font-semibold text-gray-700">
              Dirección de envío
            </label>
            <input
              id="profile-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, departamento, ciudad"
              required
              minLength={5}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Inline error */}
        {error && (
          <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        {/* Submit */}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? "Guardando…" : "Guardar y continuar"}
          </button>
        </div>
      </form>
    </div>
  )
}

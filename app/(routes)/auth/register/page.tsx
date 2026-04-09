"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Role = "RETAIL" | "WHOLESALE"

const CUIT_REGEX = /^\d{11}$/

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [role, setRole] = useState<Role>("RETAIL")
  const [cuit, setCuit] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side CUIT validation
    if (role === "WHOLESALE") {
      if (!razonSocial.trim()) {
        setError("La razón social es requerida para cuentas mayoristas")
        return
      }
      if (!CUIT_REGEX.test(cuit.replace(/[-\s]/g, ""))) {
        setError("El CUIT debe tener exactamente 11 dígitos (sin guiones ni espacios)")
        return
      }
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          address: address || undefined,
          role,
          cuit: role === "WHOLESALE" ? cuit.replace(/[-\s]/g, "") : undefined,
          razonSocial: role === "WHOLESALE" ? razonSocial : undefined,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? "Error al registrarse")
        return
      }

      setRegistered(true)
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/products" className="text-2xl font-bold text-gray-900">
            Benticuaga
          </Link>
          <p className="mt-2 text-sm text-gray-600">Creá tu cuenta</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {registered ? (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Revisá tu email</h2>
              <p className="text-sm text-gray-500">
                Te enviamos un link de verificación a <strong>{email}</strong>. Hacé clic ahí para activar tu cuenta.
              </p>
              <Link href="/auth/login" className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Ir al login
              </Link>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                  Apellido
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="García"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Corrientes 1234, CABA"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Role toggle */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Tipo de cuenta</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("RETAIL")}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    role === "RETAIL"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Minorista
                </button>
                <button
                  type="button"
                  onClick={() => setRole("WHOLESALE")}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    role === "WHOLESALE"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Mayorista
                </button>
              </div>
            </div>

            {/* WHOLESALE-only fields */}
            {role === "WHOLESALE" && (
              <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Datos de empresa
                </p>
                <div>
                  <label htmlFor="razonSocial" className="mb-1 block text-sm font-medium text-gray-700">
                    Razón social <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="razonSocial"
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Mi Empresa S.A."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label htmlFor="cuit" className="mb-1 block text-sm font-medium text-gray-700">
                    CUIT <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cuit"
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="20123456789"
                    maxLength={13}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <p className="mt-1 text-xs text-gray-500">11 dígitos sin guiones ni espacios</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
          )}

          {!registered && (
            <p className="mt-6 text-center text-sm text-gray-600">
              ¿Ya tenés cuenta?{" "}
              <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Ingresá
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

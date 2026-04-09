"use client"

import { useState, FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const justVerified = searchParams.get("verified") === "1"
  const justReset = searchParams.get("reset") === "1"

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setUnverifiedEmail(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!data.success) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(email)
        } else {
          setError(data.error ?? "Error al ingresar")
        }
        return
      }

      login(data.data.token)
      router.push("/products")
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!unverifiedEmail) return
    setResendSent(false)
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    })
    const data = await res.json()
    if (data.success) setResendSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/products" className="text-2xl font-bold text-gray-900">
            Benticuaga
          </Link>
          <p className="mt-2 text-sm text-gray-600">Ingresá a tu cuenta</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {justVerified && (
            <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Email verificado correctamente. Ya podés ingresar.
            </div>
          )}

          {justReset && (
            <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Contraseña actualizada. Ya podés ingresar con tu nueva contraseña.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
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

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
            )}

            {unverifiedEmail && (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">Email no verificado</p>
                <p className="mt-0.5">Revisá tu bandeja de entrada y hacé clic en el link de verificación.</p>
                {resendSent ? (
                  <p className="mt-2 font-medium text-green-700">Reenviado. Revisá tu email.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="mt-2 font-medium underline hover:text-amber-900"
                  >
                    Reenviar email de verificación
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tenés cuenta?{" "}
            <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-700">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

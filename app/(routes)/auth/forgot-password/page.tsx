"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.error ?? "Error al enviar el email")
      }
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
          <p className="mt-2 text-sm text-gray-600">Recuperar contraseña</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {sent ? (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Revisá tu email</h2>
              <p className="text-sm text-gray-500">
                Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña.
              </p>
              <Link href="/auth/login" className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-gray-600">
                Ingresá tu email y te enviamos un link para restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? "Enviando…" : "Enviar link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

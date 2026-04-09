"use client"

import { useState, FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (!token) {
      setError("Token inválido. Solicitá un nuevo link.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/auth/login?reset=1")
      } else {
        setError(data.error ?? "No se pudo restablecer la contraseña")
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center space-y-3">
        <p className="text-sm text-red-600">Link inválido o expirado.</p>
        <Link href="/auth/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Solicitar nuevo link
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Nueva contraseña
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
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repetí la contraseña"
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
          {loading ? "Guardando…" : "Guardar nueva contraseña"}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/products" className="text-2xl font-bold text-gray-900">
            Benticuaga
          </Link>
          <p className="mt-2 text-sm text-gray-600">Restablecer contraseña</p>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setError("No se encontró el token de verificación.")
      return
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success")
          setTimeout(() => router.push("/auth/login?verified=1"), 2500)
        } else {
          setStatus("error")
          setError(data.error ?? "No se pudo verificar el email.")
        }
      })
      .catch(() => {
        setStatus("error")
        setError("Error de conexión. Intentá de nuevo.")
      })
  }, [token, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/products" className="mb-8 block text-2xl font-bold text-gray-900">
          Benticuaga
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
              <p className="text-sm font-medium text-gray-700">Verificando tu email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Email verificado</h2>
              <p className="mt-2 text-sm text-gray-500">Tu cuenta está activa. Redirigiendo al login…</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Error de verificación</h2>
              <p className="mt-2 text-sm text-red-600">{error}</p>
              <Link
                href="/auth/login"
                className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Ir al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}

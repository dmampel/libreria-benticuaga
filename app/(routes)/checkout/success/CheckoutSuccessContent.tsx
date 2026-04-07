"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/lib/hooks/useCart"

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()

  const externalReference = searchParams.get("external_reference") // our orderId
  const paymentId = searchParams.get("payment_id")
  const status = searchParams.get("status")

  // Clear cart once we land on the success page with a valid payment
  useEffect(() => {
    if (paymentId) clearCart()
  }, [paymentId, clearCart])

  const orderId = externalReference

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Success icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Pago exitoso!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Tu pedido fue procesado correctamente.
          </p>
        </div>

        {/* Order info */}
        {orderId && (
          <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Detalles del pedido
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Número de confirmación</dt>
                <dd className="font-mono text-xs font-medium text-gray-900">#{orderId.slice(0, 8)}</dd>
              </div>
              {paymentId && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">ID de pago</dt>
                  <dd className="font-mono text-xs text-gray-700">{paymentId}</dd>
                </div>
              )}
              {status && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Estado</dt>
                  <dd>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {status === "approved" ? "Aprobado" : status}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          {orderId && (
            <a
              href={`${process.env.NEXT_PUBLIC_BACK_URL ?? "http://localhost:3000"}/account/orders/${orderId}?payment_success=1`}
              className="flex-1 rounded-xl bg-gray-900 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Ver mi pedido
            </a>
          )}
          <a
            href={`${process.env.NEXT_PUBLIC_BACK_URL ?? "http://localhost:3000"}/products?payment_success=1`}
            className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
          >
            Seguir comprando
          </a>
        </div>
      </div>
    </div>
  )
}

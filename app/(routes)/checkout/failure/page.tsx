"use client"

import Link from "next/link"

export default function CheckoutFailurePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Failure icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pago cancelado</h1>
          <p className="mt-2 text-sm text-gray-500">
            El pago fue cancelado o rechazado. Tu carrito sigue intacto.
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/checkout"
            className="flex-1 rounded-xl bg-blue-500 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          >
            Intentar de nuevo
          </Link>
          <Link
            href="/products"
            className="flex-1 rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
          >
            Volver a productos
          </Link>
        </div>
      </div>
    </div>
  )
}

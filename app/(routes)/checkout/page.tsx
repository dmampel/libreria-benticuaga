"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/hooks/useCart"
import { useAuth } from "@/lib/hooks/useAuth"
import { getPrice, getPriceLabel } from "@/lib/pricing"
import ProfileForm, { type FullProfile } from "@/components/ProfileForm"
import { useToast } from "@/context/ToastContext"

type CheckoutState = "idle" | "loading" | "error"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, userRole, getTotal } = useCart()
  const { user } = useAuth()

  // Auth readiness — useAuth reads localStorage on mount, so user is null on first render
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const { showToast } = useToast()
  const [state, setState] = useState<CheckoutState>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const total = getTotal()

  // Mark auth as ready after first paint
  useEffect(() => { setAuthReady(true) }, [])

  // Redirect if not authenticated (after auth has initialised)
  useEffect(() => {
    if (authReady && !user) {
      router.push("/auth/login?redirect=/checkout")
    }
  }, [authReady, user, router])

  // Fetch full profile (phone + address not in JWT) — cookie sent automatically
  useEffect(() => {
    if (!user) return
    setProfileLoading(true)
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProfile(data.data as FullProfile)
      })
      .catch(() => {/* silently ignore — user will be prompted to fill form */})
      .finally(() => setProfileLoading(false))
  }, [user])

  // ── Loading / redirecting ────────────────────────────────────
  if (!authReady || (user && profileLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  if (!user) return null

  // ── Empty cart ───────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg
            className="h-16 w-16 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
          <p className="text-sm text-gray-500">Agregá productos antes de hacer el checkout.</p>
          <Link
            href="/products"
            className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Ver productos
          </Link>
        </div>
      </div>
    )
  }

  const profileComplete = Boolean(profile?.phone && profile?.address)

  // ── Pay with Mercado Pago ────────────────────────────────────
  async function handleMercadoPago() {
    setState("loading")
    setErrorMsg("")

    try {
      const checkoutItems = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: getPrice(item, userRole),
      }))

      const res = await fetch("/api/checkout/mercado-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          total,
          userRole,
          userId: user?.id,
          userEmail: user?.email,
        }),
      })

      const data = (await res.json()) as {
        success: boolean
        checkoutUrl?: string
        preferenceId?: string
        error?: string
      }

      if (!data.success || !data.checkoutUrl) {
        const msg = data.error ?? "Error al iniciar el pago. Intentá de nuevo."
        setErrorMsg(msg)
        showToast(msg, "error")
        setState("error")
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      const msg = "Error de conexión. Verificá tu internet e intentá de nuevo."
      setErrorMsg(msg)
      showToast(msg, "error")
      setState("error")
    }
  }

  // ── Page ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/cart"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver al carrito
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">Confirmar pedido</h1>
      <p className="mb-8 text-sm text-gray-500">
        Revisá tu pedido y pagá con Mercado Pago de forma segura.
      </p>

      {/* ── Profile guard — shown until phone + address are provided ── */}
      {!profileComplete && (
        <ProfileForm
          currentPhone={profile?.phone ?? ""}
          currentAddress={profile?.address ?? ""}
          onComplete={(updated) => setProfile(updated)}
        />
      )}

      {/* ── Order summary — shown once profile is complete ── */}
      {profileComplete && (
        <>
          {/* Pricing tier badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            Precio {getPriceLabel(userRole)}
          </div>

          {/* Shipping info */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">
              <span className="font-medium">Envío a: </span>{profile?.address}
            </span>
          </div>

          {/* Order table */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3 text-center">Cant.</th>
                  <th className="px-5 py-3 text-right">P. Unit.</th>
                  <th className="px-5 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const unitPrice = getPrice(item, userRole)
                  const subtotal = unitPrice * item.quantity
                  return (
                    <tr key={item.productId}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">#{item.productId}</p>
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-5 py-4 text-right text-gray-600">${unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        ${subtotal.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td colSpan={3} className="px-5 py-4 text-right text-sm font-semibold text-gray-700">
                    Total
                  </td>
                  <td className="px-5 py-4 text-right text-lg font-bold text-gray-900">
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Error message */}
          {state === "error" && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={handleMercadoPago}
              disabled={state === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 sm:w-auto"
            >
              {state === "loading" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 13.5h-11a1.5 1.5 0 010-3h11a1.5 1.5 0 010 3z" />
                  </svg>
                  Pagar con Mercado Pago
                </>
              )}
            </button>

            <Link
              href="/cart"
              className="w-full rounded-xl border border-gray-200 px-6 py-3.5 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 sm:w-auto"
            >
              Volver al carrito
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Serás redirigido a Mercado Pago para completar el pago de forma segura.
          </p>
        </>
      )}
    </div>
  )
}

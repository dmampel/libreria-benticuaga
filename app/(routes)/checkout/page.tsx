"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCart } from "@/lib/hooks/useCart"
import { getPrice, getPriceLabel } from "@/lib/pricing"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/lib/hooks/useAuth"

type CheckoutState = "idle" | "loading" | "error"

interface GuestForm {
  name: string
  email: string
  phone: string
  address: string
}

export default function CheckoutPage() {
  const { items, userRole, getTotal } = useCart()
  const { showToast } = useToast()
  const { user, isAuthenticated } = useAuth()

  const [state, setState] = useState<CheckoutState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [form, setForm] = useState<GuestForm>({ name: "", email: "", phone: "", address: "" })

  // Pre-fill form for authenticated users
  useEffect(() => {
    if (!user) return
    // Fill name and email instantly from JWT (no round-trip needed)
    setForm((prev) => ({
      ...prev,
      name: [user.firstName, user.lastName].filter(Boolean).join(" "),
      email: user.email,
    }))
    // Fetch phone and address from DB
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setForm((prev) => ({
            ...prev,
            phone: data.data.phone ?? "",
            address: data.data.address ?? "",
          }))
        }
      })
  }, [user])

  const total = getTotal()

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── Pay with Mercado Pago ────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          guestAddress: form.address,
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
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
        Completá tus datos y pagá con Mercado Pago de forma segura.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* ── Left column: Guest form ── */}
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Datos de contacto</h2>

            {isAuthenticated && (
              <div className="flex items-center gap-2.5 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>
                  Datos de <strong>{user?.email}</strong> cargados automáticamente.{" "}
                  <Link href="/account" className="underline underline-offset-2 hover:text-indigo-900">
                    Editar perfil
                  </Link>
                </span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Juan García"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="juan@ejemplo.com"
                readOnly={isAuthenticated}
                className={`w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition ${
                  isAuthenticated
                    ? "cursor-default bg-gray-50 text-gray-500"
                    : "focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                }`}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+54 9 11 1234-5678"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
                Dirección de envío <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={form.address}
                onChange={handleChange}
                placeholder="Av. Corrientes 1234, CABA"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          </div>

          {/* ── Right column: Order summary ── */}
          <div>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Tu pedido</h2>

            {/* Pricing tier badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              Precio {getPriceLabel(userRole)}
            </div>

            {/* Order table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3 text-center">Cant.</th>
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
                          <p className="text-xs text-gray-400">x{item.quantity} — ${unitPrice.toFixed(2)} c/u</p>
                        </td>
                        <td className="px-5 py-4 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td colSpan={2} className="px-5 py-4 text-right text-sm font-semibold text-gray-700">
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
                type="submit"
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
          </div>
        </div>
      </form>
    </div>
  )
}

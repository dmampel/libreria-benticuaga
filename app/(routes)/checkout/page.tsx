"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCart } from "@/lib/hooks/useCart"
import { getPrice, getPriceLabel } from "@/lib/pricing"
import { useToast } from "@/context/ToastContext"
import { useAuth } from "@/lib/hooks/useAuth"

type CheckoutState = "idle" | "loading" | "error"
type DeliveryType = "DELIVERY" | "PICKUP"
type PaymentMethod = "MERCADO_PAGO" | "CASH"

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
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MERCADO_PAGO")

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      name: [user.firstName, user.lastName].filter(Boolean).join(" "),
      email: user.email,
    }))
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

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <svg className="h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
          <p className="text-sm text-gray-500">Agregá productos antes de hacer el checkout.</p>
          <Link href="/products" className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700">
            Ver productos
          </Link>
        </div>
      </div>
    )
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState("loading")
    setErrorMsg("")

    const checkoutItems = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: getPrice(item, userRole),
    }))

    const branchName = process.env.NEXT_PUBLIC_BRANCH_NAME ?? "Sucursal"

    const sharedPayload = {
      items: checkoutItems,
      total,
      userRole,
      guestName: form.name,
      guestEmail: form.email,
      guestPhone: form.phone,
      guestAddress: deliveryType === "DELIVERY" ? form.address : undefined,
      deliveryType,
      branchName: deliveryType === "PICKUP" ? branchName : undefined,
    }

    try {
      if (paymentMethod === "MERCADO_PAGO") {
        const res = await fetch("/api/checkout/mercado-pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sharedPayload),
        })
        const data = (await res.json()) as { success: boolean; checkoutUrl?: string; error?: string }

        if (!data.success || !data.checkoutUrl) {
          const msg = data.error ?? "Error al iniciar el pago. Intentá de nuevo."
          setErrorMsg(msg)
          showToast(msg, "error")
          setState("error")
          return
        }
        window.location.href = data.checkoutUrl
      } else {
        const res = await fetch("/api/checkout/cash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sharedPayload),
        })
        const data = (await res.json()) as { success: boolean; orderId?: string; error?: string }

        if (!data.success || !data.orderId) {
          const msg = data.error ?? "Error al confirmar el pedido. Intentá de nuevo."
          setErrorMsg(msg)
          showToast(msg, "error")
          setState("error")
          return
        }
        window.location.href = `/checkout/success?orderId=${data.orderId}&paymentMethod=CASH&deliveryType=${deliveryType}`
      }
    } catch {
      const msg = "Error de conexión. Verificá tu internet e intentá de nuevo."
      setErrorMsg(msg)
      showToast(msg, "error")
      setState("error")
    }
  }

  const cardBase = "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all"
  const cardSelected = "border-violet-500 bg-violet-50"
  const cardUnselected = "border-gray-200 hover:border-gray-300"

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cart" className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver al carrito
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">Confirmar pedido</h1>
      <p className="mb-8 text-sm text-gray-500">Elegí cómo recibir tu pedido y cómo pagarlo.</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* ── Left column ── */}
          <div className="space-y-8">

            {/* Sección 1: Tipo de entrega */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900">Tipo de entrega</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className={`${cardBase} ${deliveryType === "DELIVERY" ? cardSelected : cardUnselected}`}>
                  <input type="radio" name="deliveryType" value="DELIVERY" className="sr-only" checked={deliveryType === "DELIVERY"} onChange={() => setDeliveryType("DELIVERY")} />
                  <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${deliveryType === "DELIVERY" ? "text-violet-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${deliveryType === "DELIVERY" ? "text-violet-700" : "text-gray-700"}`}>Envío a domicilio</p>
                    <p className="text-xs text-gray-400">Te lo llevamos</p>
                  </div>
                </label>

                <label className={`${cardBase} ${deliveryType === "PICKUP" ? cardSelected : cardUnselected}`}>
                  <input type="radio" name="deliveryType" value="PICKUP" className="sr-only" checked={deliveryType === "PICKUP"} onChange={() => setDeliveryType("PICKUP")} />
                  <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${deliveryType === "PICKUP" ? "text-violet-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${deliveryType === "PICKUP" ? "text-violet-700" : "text-gray-700"}`}>Retiro en sucursal</p>
                    <p className="text-xs text-gray-400">Retirá cuando quieras</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Sección 2: Datos de contacto */}
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Datos de contacto</h2>

              {isAuthenticated && (
                <div className="flex items-center gap-2.5 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>
                    Datos de <strong>{user?.email}</strong> cargados automáticamente.{" "}
                    <Link href="/account" className="underline underline-offset-2 hover:text-indigo-900">Editar perfil</Link>
                  </span>
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input id="name" name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Juan García"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100" />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="juan@ejemplo.com"
                  readOnly={isAuthenticated}
                  className={`w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition ${isAuthenticated ? "cursor-default bg-gray-50 text-gray-500" : "focus:border-gray-400 focus:ring-2 focus:ring-gray-100"}`} />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input id="phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} placeholder="+54 9 11 1234-5678"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100" />
              </div>

              {deliveryType === "DELIVERY" ? (
                <div>
                  <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Dirección de envío <span className="text-red-500">*</span>
                  </label>
                  <input id="address" name="address" type="text" required value={form.address} onChange={handleChange} placeholder="Av. Corrientes 1234, CABA"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100" />
                </div>
              ) : (
                <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-4 space-y-1.5">
                  <p className="text-sm font-semibold text-violet-800">
                    {process.env.NEXT_PUBLIC_BRANCH_NAME ?? "Nuestra sucursal"}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-violet-700">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {process.env.NEXT_PUBLIC_BRANCH_ADDRESS ?? "Consultá la dirección"}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-violet-700">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {process.env.NEXT_PUBLIC_BRANCH_HOURS ?? "Consultá los horarios"}
                  </p>
                </div>
              )}
            </div>

            {/* Sección 3: Método de pago */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900">Método de pago</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className={`${cardBase} ${paymentMethod === "MERCADO_PAGO" ? cardSelected : cardUnselected}`}>
                  <input type="radio" name="paymentMethod" value="MERCADO_PAGO" className="sr-only" checked={paymentMethod === "MERCADO_PAGO"} onChange={() => setPaymentMethod("MERCADO_PAGO")} />
                  <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${paymentMethod === "MERCADO_PAGO" ? "text-violet-600" : "text-gray-400"}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 13.5h-11a1.5 1.5 0 010-3h11a1.5 1.5 0 010 3z" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${paymentMethod === "MERCADO_PAGO" ? "text-violet-700" : "text-gray-700"}`}>Mercado Pago</p>
                    <p className="text-xs text-gray-400">Pagá ahora online</p>
                  </div>
                </label>

                <label className={`${cardBase} ${paymentMethod === "CASH" ? cardSelected : cardUnselected}`}>
                  <input type="radio" name="paymentMethod" value="CASH" className="sr-only" checked={paymentMethod === "CASH"} onChange={() => setPaymentMethod("CASH")} />
                  <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${paymentMethod === "CASH" ? "text-violet-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${paymentMethod === "CASH" ? "text-violet-700" : "text-gray-700"}`}>Efectivo / POS</p>
                    <p className="text-xs text-gray-400">Pagá al recibir</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ── Right column: Order summary ── */}
          <div>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Tu pedido</h2>

            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              Precio {getPriceLabel(userRole)}
            </div>

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
                        <td className="px-5 py-4 text-right font-semibold text-gray-900">${subtotal.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td colSpan={2} className="px-5 py-4 text-right text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-5 py-4 text-right text-lg font-bold text-gray-900">${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {state === "error" && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

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
                ) : paymentMethod === "MERCADO_PAGO" ? (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 13.5h-11a1.5 1.5 0 010-3h11a1.5 1.5 0 010 3z" />
                    </svg>
                    Pagar con Mercado Pago
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Confirmar pedido
                  </>
                )}
              </button>

              <Link href="/cart" className="w-full rounded-xl border border-gray-200 px-6 py-3.5 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 sm:w-auto">
                Volver al carrito
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              {paymentMethod === "MERCADO_PAGO"
                ? "Serás redirigido a Mercado Pago para completar el pago de forma segura."
                : "Tu pedido será confirmado y te contactaremos para coordinar."}
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}

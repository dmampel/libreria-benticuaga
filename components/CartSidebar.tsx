"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/lib/hooks/useCart"
import { getPrice } from "@/lib/pricing"

export default function CartSidebar() {
  const {
    items,
    userRole,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    getTotal,
    getItemCount,
  } = useCart()

  const total = getTotal()
  const itemCount = getItemCount()

  // Lock body scroll and close on Escape when open
  useEffect(() => {
    if (!isCartOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsCartOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isCartOpen, setIsCartOpen])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">
              Carrito
              {itemCount > 0 && (
                <span className="ml-1.5 text-sm font-normal text-gray-400">({itemCount})</span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar carrito"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <svg
              className="h-16 w-16 text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-600">Tu carrito está vacío</p>
            <p className="text-xs text-gray-400">Agregá productos para comenzar tu pedido.</p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Seguir comprando
            </button>
          </div>
        ) : (
          /* Item list */
          <ul className="flex-1 divide-y divide-gray-50 overflow-y-auto px-5 py-1">
            {items.map((item) => {
              const unitPrice = getPrice(item, userRole)
              const hasImage = item.image.startsWith("http")

              return (
                <li key={item.productId} className="flex gap-3 py-4">
                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    {hasImage ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          className="h-6 w-6 text-gray-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Eliminar ${item.name}`}
                        className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-0 rounded-lg border border-gray-200 bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Reducir cantidad"
                          className="flex h-7 w-7 items-center justify-center text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-30"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                          </svg>
                        </button>
                        <span className="min-w-[1.75rem] text-center text-sm font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Aumentar cantidad"
                          className="flex h-7 w-7 items-center justify-center text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-30"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>

                      <p className="text-sm font-bold text-gray-900">
                        ${(unitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <p className="text-xs text-gray-400">${unitPrice.toFixed(2)} c/u</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Footer — only when items exist */}
        {items.length > 0 && (
          <div className="flex-shrink-0 space-y-3 border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
              <span className="text-base font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400">Envío a coordinar al finalizar el pedido.</p>

            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="block w-full rounded-xl bg-gray-900 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Iniciar Compra
            </Link>
            <Link
              href="/cart"
              onClick={() => setIsCartOpen(false)}
              className="block w-full rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              Ver carrito completo
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

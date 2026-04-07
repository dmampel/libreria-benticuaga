"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/hooks/useCart"
import QuantitySelector from "@/components/QuantitySelector"
import { getPrice, getPriceLabel } from "@/lib/pricing"

export default function CartPage() {
  const { items, userRole, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCart()

  const total = getTotal()
  const itemCount = getItemCount()

  // ── Empty state ──────────────────────────────────────────────
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
          <p className="text-sm text-gray-500">Agregá productos para comenzar tu pedido.</p>
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

  // ── Cart with items ──────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Carrito
          <span className="ml-2 text-base font-normal text-gray-400">
            ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-gray-400 underline underline-offset-2 transition-colors hover:text-red-500"
        >
          Vaciar carrito
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Item list */}
        <ul className="col-span-2 flex flex-col divide-y divide-gray-100">
          {items.map((item) => {
            const unitPrice = getPrice(item, userRole)
            const subtotal = unitPrice * item.quantity
            const hasImage = item.image.startsWith("http")

            return (
              <li key={item.productId} className="flex gap-4 py-5">
                {/* Thumbnail */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                  {hasImage ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-400">#{item.productId}</p>
                    </div>
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
                    <QuantitySelector
                      quantity={item.quantity}
                      onQuantityChange={(qty) => updateQuantity(item.productId, qty)}
                      maxQuantity={item.stock}
                    />
                    <p className="text-sm font-bold text-gray-900">
                      ${subtotal.toFixed(2)}
                    </p>
                  </div>

                  <p className="text-xs text-gray-400">
                    ${unitPrice.toFixed(2)} × {item.quantity} · {getPriceLabel(userRole)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Order summary */}
        <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Resumen del pedido</h2>

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <dt>Subtotal ({itemCount} items)</dt>
              <dd>${total.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between text-gray-500">
              <dt>Envío</dt>
              <dd>A coordinar</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
              <dt>Total</dt>
              <dd>${total.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/checkout"
              className="w-full rounded-xl bg-gray-900 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Ir al checkout
            </Link>
            <Link
              href="/products"
              className="w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
            >
              Continuar comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

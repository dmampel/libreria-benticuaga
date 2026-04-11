"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/hooks/useCart"
import { getPrice, getPriceLabel } from "@/lib/pricing"
import { useToast } from "@/context/ToastContext"

interface Product {
  id: string
  name: string
  retailPrice: number
  wholesalePrice: number
  stock: number
  image: string
}

export default function ProductCard({ 
  product, 
  priority = false 
}: { 
  product: Product, 
  priority?: boolean 
}) {
  const { addItem, userRole } = useCart()
  const { showToast } = useToast()
  const hasImage = product.image.startsWith("http")
  const displayPrice = getPrice(product, userRole)

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      stock: product.stock,
      image: product.image,
    })
    showToast("Agregado al carrito", "success")
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        {hasImage ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
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
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M5.25 21V3.75A.75.75 0 016 3h12a.75.75 0 01.75.75V21"
              />
            </svg>
          </div>
        )}

        {product.stock === 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-gray-700 px-2 py-0.5 text-xs font-medium text-white">
            Sin stock
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
            {product.name}
          </h2>
          <p className="mt-1 text-xs text-gray-400">#{product.id}</p>
        </div>

        {/* Role-based price */}
        <div>
          <p className="text-lg font-bold text-gray-900">${displayPrice.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{getPriceLabel(userRole)}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/products/${product.id}`}
            className="w-full rounded-xl border border-gray-200 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
          >
            Ver detalle
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full rounded-xl bg-gray-900 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {product.stock === 0 ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </article>
  )
}

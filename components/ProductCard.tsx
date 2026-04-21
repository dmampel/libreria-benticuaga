"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/hooks/useCart"
import { getPrice } from "@/lib/pricing"
import { getBrandColor } from "@/lib/brands"

interface Product {
  id: string
  name: string
  retailPrice: number
  wholesalePrice: number
  stock: number
  image: string
  brand?: { name: string } | null
}

export default function ProductCard({ 
  product, 
  priority = false 
}: { 
  product: Product, 
  priority?: boolean 
}) {
  const { addItem, userRole } = useCart()
  const hasImage = product.image.startsWith("http")
  const displayPrice = getPrice(product, userRole)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      stock: product.stock,
      image: product.image,
    })
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/40">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-gray-50/30 block">
        {hasImage ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-110"
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
          <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">
            Sin stock
          </span>
        )}

        {product.brand?.name && (
          <span className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all duration-300 opacity-90 group-hover:opacity-100 ${getBrandColor(product.brand.name)}`}>
            {product.brand.name}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex font-sans flex-1 flex-col p-5 sm:p-6">
        <Link href={`/products/${product.id}`} className="flex flex-1 flex-col items-start">
          <h2 className="line-clamp-2 text-base font-bold leading-tight text-gray-800 transition-colors group-hover:text-indigo-600 sm:text-lg">
            {product.name}
          </h2>
        </Link>

        {/* Price & Actions */}
        <div className="mt-5 flex flex-col items-start justify-between gap-3">
          <div>
            <p className="font-sans text-2xl tracking-tight text-gray-800">
              ${displayPrice.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full items-center justify-center rounded-2xl border-2 border-emerald-500 px-3 py-2 text-sm font-bold text-emerald-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-200 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
            aria-label="Agregar al carrito"
          >
            {product.stock === 0 ? "Agotado" : "Al carrito"}
          </button>
        </div>
      </div>
    </article>
  )
}

"use client"

import { useState } from "react"
import QuantitySelector from "@/components/QuantitySelector"
import { useCart } from "@/lib/hooks/useCart"
import { getPrice } from "@/lib/pricing"

interface Product {
  id: string
  name: string
  retailPrice: number
  wholesalePrice: number
  stock: number
  image: string
}

export default function ProductActions({ product }: { product: Product }) {
  const { addItem, userRole } = useCart()
  const [quantity, setQuantity] = useState(1)
  const outOfStock = product.stock === 0
  const displayPrice = getPrice(product, userRole)

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        stock: product.stock,
        image: product.image,
      },
      quantity
    )
  }

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* Role-based price */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl tracking-tight text-gray-800">
            ${displayPrice.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Stock status */}
      <p className="text-sm text-gray-500">
        {outOfStock ? (
          <span className="font-medium text-red-500">Sin stock disponible</span>
        ) : (
          <>
            <span className="font-medium text-green-600">{product.stock} unidades</span>{" "}
            en stock
          </>
        )}
      </p>

      {/* Quantity selector */}
      {!outOfStock && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Cantidad</label>
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={setQuantity}
            maxQuantity={product.stock}
            disabled={outOfStock}
          />
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={outOfStock}
        className="w-auto md:w-[40%] items-center justify-center rounded-2xl border-2 border-emerald-500 px-8 py-3.5 text-sm font-bold text-emerald-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-200 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
      >
        {outOfStock ? "Agotado" : "Al carrito"}
      </button>
    </div>
  )
}

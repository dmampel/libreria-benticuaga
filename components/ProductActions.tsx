"use client"

import { useState } from "react"
import QuantitySelector from "@/components/QuantitySelector"
import { useCart } from "@/lib/hooks/useCart"
import { getPrice, getPriceLabel } from "@/lib/pricing"

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
    <div className="flex flex-col gap-5">
      {/* Role-based price */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
          <span className="text-sm text-gray-400">por unidad</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">{getPriceLabel(userRole)}</p>
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
        className="w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 sm:w-auto"
      >
        {outOfStock ? "Sin stock" : "Agregar al carrito"}
      </button>
    </div>
  )
}

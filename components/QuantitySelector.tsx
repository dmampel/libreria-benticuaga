"use client"

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (qty: number) => void
  maxQuantity: number
  disabled?: boolean
}

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  maxQuantity,
  disabled = false,
}: QuantitySelectorProps) {
  const clamp = (value: number) => Math.min(Math.max(1, value), maxQuantity)

  function handleDecrement() {
    if (quantity > 1) onQuantityChange(quantity - 1)
  }

  function handleIncrement() {
    if (quantity < maxQuantity) onQuantityChange(quantity + 1)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseInt(e.target.value, 10)
    if (!isNaN(parsed)) onQuantityChange(clamp(parsed))
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Correct empty or out-of-range values on blur
    const parsed = parseInt(e.target.value, 10)
    onQuantityChange(isNaN(parsed) ? 1 : clamp(parsed))
  }

  const isAtMin = quantity <= 1
  const isAtMax = quantity >= maxQuantity

  return (
    <div className="flex items-center gap-0 overflow-hidden rounded-xl border border-gray-200 w-fit">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || isAtMin}
        aria-label="Disminuir cantidad"
        className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>

      <input
        type="number"
        min={1}
        max={maxQuantity}
        value={quantity}
        onChange={handleInput}
        onBlur={handleBlur}
        disabled={disabled}
        aria-label="Cantidad"
        className="h-10 w-14 border-x border-gray-200 bg-white text-center text-sm font-semibold text-gray-900 [appearance:textfield] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || isAtMax}
        aria-label="Aumentar cantidad"
        className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

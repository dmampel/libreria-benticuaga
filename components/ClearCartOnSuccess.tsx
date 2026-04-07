"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCart } from "@/lib/hooks/useCart"

// Clears the cart when landing from a successful MP payment
// Works even when success page is on a different domain (ngrok)
export default function ClearCartOnSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { clearCart } = useCart()

  useEffect(() => {
    if (searchParams.get("payment_success") !== "1") return

    clearCart()

    // Remove the param from the URL without triggering a re-render
    const params = new URLSearchParams(searchParams.toString())
    params.delete("payment_success")
    const clean = params.size > 0 ? `${pathname}?${params}` : pathname
    router.replace(clean)
  }, [searchParams, pathname, router, clearCart])

  return null
}

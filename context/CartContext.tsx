"use client"

import { createContext, useCallback, useEffect, useState } from "react"
import type { Role } from "@prisma/client"
import { getPrice } from "@/lib/pricing"

// ============ Types ============

export interface CartItem {
  productId: string
  name: string
  retailPrice: number
  wholesalePrice: number
  stock: number
  image: string
  quantity: number
}

export interface CartContextType {
  items: CartItem[]
  userRole: Role
  setUserRole: (role: Role) => void
  addItem: (product: Omit<CartItem, "quantity">, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

// ============ Context ============

export const CartContext = createContext<CartContextType | null>(null)

// ============ Persistence helpers ============

const CART_KEY = "benticuaga_cart"
const ROLE_KEY = "benticuaga_userRole"

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function loadRole(): Role {
  if (typeof window === "undefined") return "RETAIL"
  try {
    const raw = localStorage.getItem(ROLE_KEY)
    return raw === "WHOLESALE" ? "WHOLESALE" : "RETAIL"
  } catch {
    return "RETAIL"
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // Silently ignore (e.g. private mode quota exceeded)
  }
}

function saveRole(role: Role): void {
  try {
    localStorage.setItem(ROLE_KEY, role)
  } catch {
    // Silently ignore
  }
}

// ============ Provider ============

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [userRole, setUserRoleState] = useState<Role>("RETAIL")
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on first client render
  useEffect(() => {
    setItems(loadCart())
    setUserRoleState(loadRole())
    setHydrated(true)
  }, [])

  // Persist cart whenever it changes (skip before hydration)
  useEffect(() => {
    if (hydrated) saveCart(items)
  }, [items, hydrated])

  const setUserRole = useCallback((role: Role) => {
    setUserRoleState(role)
    saveRole(role)
  }, [])

  const addItem = useCallback(
    (product: Omit<CartItem, "quantity">, quantity: number = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.productId)
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, product.stock)
          return prev.map((i) =>
            i.productId === product.productId ? { ...i, quantity: newQty } : i
          )
        }
        return [...prev, { ...product, quantity: Math.min(quantity, product.stock) }]
      })
    },
    []
  )

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i
        return { ...i, quantity: Math.min(Math.max(1, quantity), i.stock) }
      })
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const getTotal = useCallback(
    () =>
      items.reduce(
        (sum, i) => sum + getPrice({ retailPrice: i.retailPrice, wholesalePrice: i.wholesalePrice }, userRole) * i.quantity,
        0
      ),
    [items, userRole]
  )

  const getItemCount = useCallback(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        userRole,
        setUserRole,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

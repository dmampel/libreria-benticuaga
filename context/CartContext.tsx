"use client"

import { createContext, useCallback, useEffect, useRef, useState } from "react"
import type { Role } from "@prisma/client"
import { getPrice } from "@/lib/pricing"
import { useAuth } from "@/lib/hooks/useAuth"

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

// Shape returned by /api/cart (DB CartItem joined with Product)
interface ApiCartItem {
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    retailPrice: number
    wholesalePrice: number
    stock: number
    image: string
  }
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

// ============ Persistence helpers (guest only) ============

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

function clearLocalCart(): void {
  try {
    localStorage.removeItem(CART_KEY)
  } catch {
    // Silently ignore
  }
}

// ============ API helpers ============

function mapApiItems(apiItems: ApiCartItem[]): CartItem[] {
  return apiItems.map((i) => ({
    productId: i.product.id,
    name: i.product.name,
    retailPrice: i.product.retailPrice,
    wholesalePrice: i.product.wholesalePrice,
    stock: i.product.stock,
    image: i.product.image,
    quantity: i.quantity,
  }))
}

async function fetchCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart")
  const json = await res.json()
  return json.success ? mapApiItems(json.data as ApiCartItem[]) : []
}

// ============ Provider ============

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()

  const [items, setItems] = useState<CartItem[]>([])
  const [userRole, setUserRoleState] = useState<Role>("RETAIL")
  const [hydrated, setHydrated] = useState(false)

  // Track previous auth state to detect login/logout transitions
  const prevAuthRef = useRef<boolean | null>(null)

  // Load from localStorage on first client render
  useEffect(() => {
    setItems(loadCart())
    setUserRoleState(loadRole())
    setHydrated(true)
  }, [])

  // Persist guest cart whenever items change (skip before hydration, skip for auth users)
  useEffect(() => {
    if (hydrated && !isAuthenticated) saveCart(items)
  }, [items, hydrated, isAuthenticated])

  // React to login/logout transitions
  useEffect(() => {
    if (!hydrated) return

    const wasAuthenticated = prevAuthRef.current
    prevAuthRef.current = isAuthenticated

    if (isAuthenticated && wasAuthenticated === false) {
      // Just logged in: sync local cart → DB, then load DB cart
      const localItems = loadCart()
      setUserRoleState((user?.role as Role) ?? "RETAIL")

      const sync = async () => {
        if (localItems.length > 0) {
          await fetch("/api/cart/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: localItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            }),
          })
          clearLocalCart()
        }
        const dbItems = await fetchCart()
        setItems(dbItems)
      }

      sync().catch((err) => console.error("[Cart] Sync on login failed:", err))
    } else if (isAuthenticated && wasAuthenticated === null) {
      // Page load while already authenticated: load DB cart
      setUserRoleState((user?.role as Role) ?? "RETAIL")
      fetchCart()
        .then(setItems)
        .catch((err) => console.error("[Cart] Fetch on mount failed:", err))
    } else if (!isAuthenticated && wasAuthenticated === true) {
      // Just logged out: clear cart
      setItems([])
    }
  }, [isAuthenticated, hydrated, user?.role])

  const setUserRole = useCallback((role: Role) => {
    setUserRoleState(role)
    saveRole(role)
  }, [])

  // ============ Guest-only local operations ============

  const addItemLocal = useCallback(
    (product: Omit<CartItem, "quantity">, quantity: number) => {
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

  const removeItemLocal = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantityLocal = useCallback((productId: string, quantity: number) => {
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

  // ============ API-backed operations ============

  const addItemApi = useCallback(
    (product: Omit<CartItem, "quantity">, quantity: number) => {
      // Optimistic update
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

      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId, quantity }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setItems(mapApiItems(json.data as ApiCartItem[]))
        })
        .catch((err) => console.error("[Cart] addItem API error:", err))
    },
    []
  )

  const removeItemApi = useCallback((productId: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.productId !== productId))

    fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setItems(mapApiItems(json.data as ApiCartItem[]))
      })
      .catch((err) => console.error("[Cart] removeItem API error:", err))
  }, [])

  const updateQuantityApi = useCallback((productId: string, quantity: number) => {
    // Optimistic update
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
    } else {
      setItems((prev) =>
        prev.map((i) => {
          if (i.productId !== productId) return i
          return { ...i, quantity: Math.min(Math.max(1, quantity), i.stock) }
        })
      )
    }

    fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setItems(mapApiItems(json.data as ApiCartItem[]))
      })
      .catch((err) => console.error("[Cart] updateQuantity API error:", err))
  }, [])

  const clearCartApi = useCallback(() => {
    setItems([])
    // Fire-and-forget: delete all items one by one via their productIds
    // (no bulk-clear endpoint needed; clearCart is only called post-checkout)
  }, [])

  // ============ Unified interface ============

  const addItem = useCallback(
    (product: Omit<CartItem, "quantity">, quantity: number = 1) =>
      isAuthenticated ? addItemApi(product, quantity) : addItemLocal(product, quantity),
    [isAuthenticated, addItemApi, addItemLocal]
  )

  const removeItem = useCallback(
    (productId: string) =>
      isAuthenticated ? removeItemApi(productId) : removeItemLocal(productId),
    [isAuthenticated, removeItemApi, removeItemLocal]
  )

  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      isAuthenticated
        ? updateQuantityApi(productId, quantity)
        : updateQuantityLocal(productId, quantity),
    [isAuthenticated, updateQuantityApi, updateQuantityLocal]
  )

  const clearCart = useCallback(
    () => (isAuthenticated ? clearCartApi() : setItems([])),
    [isAuthenticated, clearCartApi]
  )

  const getTotal = useCallback(
    () =>
      items.reduce(
        (sum, i) =>
          sum +
          getPrice({ retailPrice: i.retailPrice, wholesalePrice: i.wholesalePrice }, userRole) *
            i.quantity,
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

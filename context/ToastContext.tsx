"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
  createElement,
} from "react"

// ============ TYPES ============

export type ToastType = "success" | "error" | "info"

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

// ============ CONTEXT ============

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  removeToast: () => {},
})

// ============ PROVIDER ============

const AUTO_DISMISS_MS = 3000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => removeToast(id), AUTO_DISMISS_MS)
    },
    [removeToast]
  )

  return createElement(
    ToastContext.Provider,
    { value: { toasts, showToast, removeToast } },
    children
  )
}

// ============ HOOK ============

export function useToast(): Pick<ToastContextValue, "showToast"> {
  const { showToast } = useContext(ToastContext)
  return { showToast }
}

// Internal hook — used only by ToastContainer
export function useToastList(): Pick<ToastContextValue, "toasts" | "removeToast"> {
  const { toasts, removeToast } = useContext(ToastContext)
  return { toasts, removeToast }
}

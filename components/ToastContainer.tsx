"use client"

import { useToastList } from "@/context/ToastContext"
import Toast from "@/components/Toast"

/**
 * ToastContainer — fixed top-right overlay, renders all active toasts.
 * Must be rendered inside <ToastProvider>.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToastList()

  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notificaciones"
      className="fixed right-4 top-4 z-[200] flex flex-col gap-3"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  )
}

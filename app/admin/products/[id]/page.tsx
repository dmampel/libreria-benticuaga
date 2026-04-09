"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm"

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuth()

  const [initial, setInitial] = useState<Partial<ProductFormData> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token || !id) return
    fetch(`/api/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const p = data.data
          setInitial({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            retailPrice: String(p.retailPrice),
            wholesalePrice: String(p.wholesalePrice),
            stock: String(p.stock),
            image: p.image ?? "",
            categoryId: p.categoryId ?? "",
          })
        } else {
          setError("Producto no encontrado")
        }
      })
      .finally(() => setLoading(false))
  }, [token, id])

  async function handleSubmit(data: ProductFormData) {
    if (!token) return { error: "No autorizado" }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          retailPrice: data.retailPrice,
          wholesalePrice: data.wholesalePrice,
          stock: data.stock,
          image: data.image,
          categoryId: data.categoryId || null,
        }),
      })
      const result = await res.json()
      if (!result.success) return { error: result.error }
      return {}
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!token) return
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      router.push("/admin/products")
    } else {
      setError(data.error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    )
  }

  if (!initial) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-gray-400">
        <p>Producto no encontrado</p>
        <Link href="/admin/products" className="text-sm text-indigo-600 hover:underline">Volver</Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar producto</h1>
        <span className="font-mono text-sm text-gray-400">{id}</span>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="max-w-2xl">
        <ProductForm
          initial={initial}
          idReadOnly
          submitLabel="Guardar cambios"
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          saving={saving}
        />
      </div>
    </div>
  )
}

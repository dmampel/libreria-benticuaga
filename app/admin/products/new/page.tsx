"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm"

export default function AdminNewProductPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(data: ProductFormData) {
    if (!token) return { error: "No autorizado" }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          description: data.description,
          retailPrice: data.retailPrice,
          wholesalePrice: data.wholesalePrice,
          stock: data.stock,
          image: data.image,
          categoryId: data.categoryId || null,
          brandId: data.brandId || null,
        }),
      })
      const result = await res.json()
      if (!result.success) return { error: result.error }
      router.push(`/admin/products`)
      return {}
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
      </div>
      <div className="max-w-6xl">
        <ProductForm submitLabel="Crear producto" onSubmit={handleSubmit} saving={saving} />
      </div>
    </div>
  )
}

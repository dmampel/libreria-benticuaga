"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { ProductTable, type ProductRow } from "@/components/admin/ProductTable"

interface Category { id: string; name: string }

const STOCK_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "in_stock", label: "En stock" },
  { value: "low", label: "Stock bajo (≤10)" },
  { value: "out", label: "Sin stock" },
]

export default function AdminProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [categoryFilter, setCategoryFilter] = useState("")
  const [stockFilter, setStockFilter] = useState("")

  function buildUrl() {
    const p = new URLSearchParams()
    if (categoryFilter) p.set("category", categoryFilter)
    if (stockFilter) p.set("stock", stockFilter)
    const qs = p.toString()
    return `/api/admin/products${qs ? `?${qs}` : ""}`
  }

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data) })
  }, [])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(buildUrl(), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data) })
      .finally(() => setLoading(false))
  }, [token, categoryFilter, stockFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStockUpdated(id: string, newStock: number) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock: newStock } : p))
  }

  function handleDeleted(ids: string[]) {
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)))
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Cargando…" : `${products.length} producto(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/import"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Importar CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Nuevo producto
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Categoría</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Stock</label>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none"
          >
            {STOCK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {(categoryFilter || stockFilter) && (
          <button
            onClick={() => { setCategoryFilter(""); setStockFilter("") }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        </div>
      ) : (
        <ProductTable
          products={products}
          onStockUpdated={handleStockUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"

export interface ProductRow {
  id: string
  name: string
  retailPrice: number
  wholesalePrice: number
  stock: number
  image: string
  category: { id: string; name: string } | null
  brand: { id: string; name: string } | null
}

type SortKey = "name" | "retailPrice" | "stock"
type SortDir = "asc" | "desc"
const PAGE_SIZE = 10

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Sin stock</span>
  if (stock <= 10) return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Stock bajo</span>
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">En stock</span>
}

interface Props {
  products: ProductRow[]
  onStockUpdated: (id: string, newStock: number) => void
  onDeleted: (ids: string[]) => void
}

export function ProductTable({ products, onStockUpdated, onDeleted }: Props) {
  const router = useRouter()
  const { token } = useAuth()

  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(0)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStock, setBulkStock] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)

  const [editingStock, setEditingStock] = useState<{ id: string; value: string } | null>(null)
  const stockInputRef = useRef<HTMLInputElement>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
    setPage(0)
  }

  const sorted = [...products].sort((a, b) => {
    let cmp = 0
    if (sortKey === "name") cmp = a.name.localeCompare(b.name)
    if (sortKey === "retailPrice") cmp = a.retailPrice - b.retailPrice
    if (sortKey === "stock") cmp = a.stock - b.stock
    return sortDir === "asc" ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const visibleIds = visible.map((p) => p.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id))
      else visibleIds.forEach((id) => next.add(id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function patchStock(id: string, stock: number) {
    if (!token) return
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock }),
    })
    const data = await res.json()
    if (data.success) onStockUpdated(id, stock)
  }

  async function handleInlineStockSave() {
    if (!editingStock) return
    const val = parseInt(editingStock.value, 10)
    if (!isNaN(val) && val >= 0) await patchStock(editingStock.id, val)
    setEditingStock(null)
  }

  async function handleBulkStockUpdate() {
    if (!bulkStock || !token || selected.size === 0) return
    const val = parseInt(bulkStock, 10)
    if (isNaN(val) || val < 0) return
    setBulkLoading(true)
    await Promise.all([...selected].map((id) => patchStock(id, val)))
    setBulkStock("")
    setSelected(new Set())
    setBulkLoading(false)
  }

  async function handleBulkDelete() {
    if (!token || selected.size === 0) return
    const confirmed = window.confirm(`¿Eliminar ${selected.size} producto(s)? Esta acción no se puede deshacer.`)
    if (!confirmed) return
    setBulkLoading(true)
    const ids = [...selected]
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
      )
    )
    const deleted = ids.filter((_, i) => results[i].success)
    onDeleted(deleted)
    setSelected(new Set())
    setBulkLoading(false)
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1 text-indigo-500">{sortDir === "asc" ? "↑" : "↓"}</span>
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">{selected.size} seleccionado(s)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              placeholder="Nuevo stock"
              className="w-28 rounded-lg border border-indigo-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
            />
            <button
              onClick={handleBulkStockUpdate}
              disabled={bulkLoading || !bulkStock}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Actualizar stock
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="ml-auto rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Eliminar seleccionados
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-4 py-3">ID</th>
              <th
                className="cursor-pointer px-4 py-3 hover:text-gray-600"
                onClick={() => toggleSort("name")}
              >
                Nombre <SortIcon k="name" />
              </th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Marca</th>
              <th
                className="cursor-pointer px-4 py-3 hover:text-gray-600"
                onClick={() => toggleSort("retailPrice")}
              >
                P. Minorista <SortIcon k="retailPrice" />
              </th>
              <th className="px-4 py-3">P. Mayorista</th>
              <th
                className="cursor-pointer px-4 py-3 hover:text-gray-600"
                onClick={() => toggleSort("stock")}
              >
                Stock <SortIcon k="stock" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                  Sin productos
                </td>
              </tr>
            )}
            {visible.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{product.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                <td className="px-4 py-3 text-gray-500">{product.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{product.brand?.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(product.retailPrice)}</td>
                <td className="px-4 py-3 text-gray-500">{formatCurrency(product.wholesalePrice)}</td>
                <td className="px-4 py-3">
                  {editingStock?.id === product.id ? (
                    <input
                      ref={stockInputRef}
                      type="number"
                      min={0}
                      value={editingStock.value}
                      onChange={(e) => setEditingStock({ id: product.id, value: e.target.value })}
                      onBlur={handleInlineStockSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleInlineStockSave()
                        if (e.key === "Escape") setEditingStock(null)
                      }}
                      autoFocus
                      className="w-20 rounded border border-indigo-300 px-2 py-0.5 text-sm focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingStock({ id: product.id, value: String(product.stock) })}
                      className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-gray-100"
                      title="Click para editar"
                    >
                      <StockBadge stock={product.stock} />
                      <span className="text-xs text-gray-400">{product.stock}</span>
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Editar →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40">
              Anterior
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-40">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

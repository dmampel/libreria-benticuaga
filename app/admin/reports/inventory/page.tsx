"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"

interface StockProduct {
  id: string
  name: string
  stock: number
  category: { name: string } | null
}

interface TopProduct {
  productId: string
  name: string
  stock: number
  category: string | null
  totalSold: number
  orderCount?: number
}

interface InventoryData {
  outOfStock: StockProduct[]
  lowStock: StockProduct[]
  topProducts: TopProduct[]
  leastOrdered: TopProduct[]
  summary: {
    totalProducts: number
    outOfStockCount: number
    lowStockCount: number
  }
}

export default function InventoryReportPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [data, setData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch("/api/admin/stats/inventory", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data) })
      .finally(() => setLoading(false))
  }, [token])

  if (loading && !data) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">Estado del stock y productos más vendidos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-medium text-gray-400">Total productos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data.summary.totalProducts}</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ring-1 ${data.summary.outOfStockCount > 0 ? "bg-red-50 ring-red-100" : "bg-white ring-gray-100"}`}>
          <p className="text-xs font-medium text-gray-400">Sin stock</p>
          <p className={`mt-1 text-2xl font-bold ${data.summary.outOfStockCount > 0 ? "text-red-700" : "text-gray-900"}`}>
            {data.summary.outOfStockCount}
          </p>
          {data.summary.outOfStockCount > 0 && (
            <p className="mt-0.5 text-xs text-red-500">Requieren reposición</p>
          )}
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ring-1 ${data.summary.lowStockCount > 0 ? "bg-amber-50 ring-amber-100" : "bg-white ring-gray-100"}`}>
          <p className="text-xs font-medium text-gray-400">Stock bajo (≤50)</p>
          <p className={`mt-1 text-2xl font-bold ${data.summary.lowStockCount > 0 ? "text-amber-700" : "text-gray-900"}`}>
            {data.summary.lowStockCount}
          </p>
          {data.summary.lowStockCount > 0 && (
            <p className="mt-0.5 text-xs text-amber-500">Revisar pronto</p>
          )}
        </div>
      </div>

      {/* Out of stock */}
      {data.outOfStock.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-red-100">
          <div className="flex items-center gap-2 border-b border-red-50 px-6 py-4">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <h2 className="text-sm font-semibold text-gray-700">Sin stock ({data.outOfStock.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.outOfStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">0 unid.</span>
                  <button
                    onClick={() => router.push(`/admin/products/${p.id}`)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock */}
      {data.lowStock.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 border-b border-amber-50 px-6 py-4">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-semibold text-gray-700">Stock bajo ({data.lowStock.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock <= 10 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>
                    {p.stock} unid.
                  </span>
                  <button
                    onClick={() => router.push(`/admin/products/${p.id}`)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top products */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-700">Más vendidos (top 10)</h2>
        </div>
        {data.topProducts.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">Sin datos de ventas</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Producto</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3 text-right">Unidades vendidas</th>
                <th className="px-6 py-3 text-right">Stock actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.topProducts.map((p, i) => (
                <tr key={p.productId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 text-xs font-bold text-gray-400">#{i + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-6 py-3 text-gray-500">{p.category ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-semibold text-indigo-700">{p.totalSold}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.stock === 0 ? "bg-red-100 text-red-700" :
                      p.stock <= 10 ? "bg-orange-100 text-orange-700" :
                      p.stock <= 50 ? "bg-amber-100 text-amber-700" :
                      "bg-green-50 text-green-700"
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Least ordered */}
      {data.leastOrdered.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Menos vendidos</h2>
            <p className="mt-0.5 text-xs text-gray-400">Productos con menor rotación — considerar descuentos o retirar del catálogo</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">Producto</th>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3 text-right">Unidades vendidas</th>
                <th className="px-6 py-3 text-right">Stock actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.leastOrdered.map((p) => (
                <tr key={p.productId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-6 py-3 text-gray-500">{p.category ?? "—"}</td>
                  <td className="px-6 py-3 text-right text-gray-500">{p.totalSold}</td>
                  <td className="px-6 py-3 text-right text-gray-500">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

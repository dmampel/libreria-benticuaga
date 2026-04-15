"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"

interface Brand {
  id: string
  name: string
  image: string | null
  _count: { products: number }
}

export default function AdminBrandsPage() {
  const { token } = useAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [globalError, setGlobalError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const formRef = useRef<HTMLDivElement>(null)

  function showToast(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  function loadBrands() {
    if (!token) return
    setLoading(true)
    fetch("/api/admin/brands", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setBrands(d.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBrands()
  }, [token])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setFormError("")

    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), image: image.trim() || null }),
    })
    const data = await res.json()
    setSaving(false)

    if (data.success) {
      setName("")
      setImage("")
      showToast("Marca creada")
      loadBrands()
    } else {
      setFormError(data.error)
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    setGlobalError("")
    const res = await fetch(`/api/admin/brands/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      setBrands((prev) => prev.filter((b) => b.id !== id))
      showToast("Marca eliminada")
    } else {
      setGlobalError(data.error)
    }
    setDeletingId(null)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
        <p className="mt-1 text-sm text-gray-500">Creá, editá o eliminá marcas de productos.</p>
      </div>

      {successMsg && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {successMsg}
        </div>
      )}

      {globalError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2">
          {loading && brands.length === 0 ? (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 divide-y divide-gray-50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-6">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3">Marca</th>
                    <th className="px-6 py-3 text-right">Productos</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {brands.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400">
                        Sin marcas. Creá la primera.
                      </td>
                    </tr>
                  )}
                  {brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {brand.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={brand.image}
                              alt={brand.name}
                              className="h-8 w-8 rounded-lg object-contain ring-1 ring-gray-100"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-400">
                              {brand.name[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{brand.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">{brand._count.products}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/brands/${brand.id}`}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Editar
                          </Link>
                          {deletingId === brand.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDelete(brand.id)}
                                className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setGlobalError(""); setDeletingId(brand.id) }}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inline create form */}
        <div className="lg:col-span-1" ref={formRef}>
          <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Nueva marca</h2>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Nombre *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Staedtler"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Logo (URL)</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt="preview"
                    className="mt-2 h-12 w-12 rounded-lg object-contain ring-1 ring-gray-100"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Crear marca"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

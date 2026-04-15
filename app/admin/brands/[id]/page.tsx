"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"

interface Brand {
  id: string
  name: string
  image: string | null
  _count: { products: number }
  createdAt: string
  updatedAt: string
}

export default function EditBrandPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const router = useRouter()

  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (!token || !id) return
    fetch(`/api/admin/brands/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBrand(d.data)
          setName(d.data.name)
          setImage(d.data.image ?? "")
        }
      })
      .finally(() => setLoading(false))
  }, [token, id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError("")

    const res = await fetch(`/api/admin/brands/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim(), image: image.trim() || null }),
    })
    const data = await res.json()
    setSaving(false)

    if (data.success) {
      setBrand(data.data)
      router.push("/admin/brands")
    } else {
      setError(data.error)
    }
  }

  async function handleDelete() {
    if (!token) return
    setDeleting(true)
    setDeleteError("")

    const res = await fetch(`/api/admin/brands/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setDeleting(false)

    if (data.success) {
      router.push("/admin/brands")
    } else {
      setDeleteError(data.error)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">Marca no encontrada.</p>
        <Link href="/admin/brands" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          Volver a Marcas
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/brands"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar marca</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {brand._count.products} {brand._count.products === 1 ? "producto asociado" : "productos asociados"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-5 text-sm font-semibold text-gray-700">Información de la marca</h2>

            <div className="space-y-4">
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
                    className="mt-3 h-16 w-16 rounded-xl object-contain ring-1 ring-gray-100"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">¿Confirmar eliminación?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setDeleteError(""); setConfirmDelete(true) }}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Eliminar marca
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>

          {deleteError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {deleteError}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

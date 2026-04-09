"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/hooks/useAuth"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  _count: { products: number }
}

interface CategoryData {
  id?: string
  name: string
  slug: string
  icon: string
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const EMOJI_MAP: Record<string, string> = {
  "cuaderno": "📓", "lapiz": "✏️", "lapices": "✏️",
  "boligrafo": "🖊️", "lapicera": "🖋️", "arte": "🎨", "dibujo": "🎨",
  "papeleria": "📎", "oficina": "🏢", "marcador": "🖍️", "fibra": "🖍️",
  "regalo": "🎁", "agenda": "📅", "planner": "📅", "mochila": "🎒",
  "estuche": "👝", "cartuchera": "👝", "carpeta": "📁", "goma": "🧽",
  "resaltador": "🖍️", "tijera": "✂️", "pegamento": "🧴", "nota": "📝", "post": "📝",
  "pintura": "🖌️"
}

function guessIcon(name: string) {
  const normName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const match = Object.keys(EMOJI_MAP).find(k => normName.includes(k))
  return match ? EMOJI_MAP[match] : "🏷️"
}

export default function AdminCategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Form State
  const [form, setForm] = useState<CategoryData>({ name: "", slug: "", icon: "" })
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Feedback States
  const [globalError, setGlobalError] = useState("")
  const [formError, setFormError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  
  const formRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  function loadCategories() {
    if (!token) return
    setLoading(true)
    fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCategories()
  }, [token])

  async function handleDelete(id: string) {
    if (!token) return
    setGlobalError("")
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
      showToast("Categoría eliminada")
      if (form.id === id) handleResetForm()
    } else {
      setGlobalError(data.error)
    }
    setDeletingId(null)
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : slugify(name),
      icon: (!prev.icon || prev.icon === "🏷️" || Object.values(EMOJI_MAP).includes(prev.icon)) && !slugEdited ? guessIcon(name) : prev.icon
    }))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugEdited(true)
    setForm((prev) => ({ ...prev, slug: e.target.value }))
  }

  function handleEditClick(cat: Category) {
    setFormError("")
    setForm({ id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon || "" })
    setSlugEdited(true)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleResetForm() {
    setFormError("")
    setForm({ id: undefined, name: "", slug: "", icon: "" })
    setSlugEdited(false)
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setFormError("")

    const isNew = !form.id
    const url = isNew ? "/api/admin/categories" : `/api/admin/categories/${form.id}`
    
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name.trim(),
        slug: form.slug.trim(),
        icon: form.icon.trim() || null,
      }),
    })
    
    const data = await res.json()
    setSaving(false)

    if (data.success) {
      showToast(isNew ? "Categoría creada" : "Categoría acutalizada")
      handleResetForm()
      loadCategories() // Refresh list
    } else {
      setFormError(data.error)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manejo de Categorías</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vista rápida para crear, editar o eliminar categorías sin salir de la página.
        </p>
      </div>

      {successMsg && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
          {successMsg}
        </div>
      )}

      {globalError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: List */}
        <div className="lg:col-span-2">
          {loading && categories.length === 0 ? (
             <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 divide-y divide-gray-50">
               {[1, 2, 3, 4].map((i) => (
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
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Ícono</th>
                    <th className="px-6 py-3 text-right">Productos</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                        Sin categorías
                      </td>
                    </tr>
                  )}
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {cat.name}
                        <br/>
                        <span className="font-mono text-xs text-gray-400">{cat.slug}</span>
                      </td>
                      <td className="px-6 py-3 text-lg">{cat.icon ?? "—"}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{cat._count.products}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(cat)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            Editar
                          </button>
                          {deletingId === cat.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDelete(cat.id)}
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
                              onClick={() => { setGlobalError(""); setDeletingId(cat.id) }}
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

        {/* Right Column: Inline Form */}
        <div className="lg:col-span-1" ref={formRef}>
          <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                {form.id ? "Editar categoría" : "Crear categoría"}
              </h2>
              {form.id && (
                <button
                  onClick={handleResetForm}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  + Nuevo
                </button>
              )}
            </div>
            
            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Nombre *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Ej: Cuadernos"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Slug *
                </label>
                <input
                  required
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="cuadernos"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Ícono (emoji)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    value={form.icon}
                    onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                    placeholder="🏷️"
                    maxLength={4}
                    className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-center text-lg focus:border-indigo-400 focus:outline-none"
                  />
                  {form.icon && (
                    <span className="text-3xl">{form.icon}</span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Crear categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

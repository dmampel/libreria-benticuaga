"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

interface Category {
  id: string;
  name: string;
}

export interface ProductFormData {
  id: string;
  name: string;
  description: string;
  retailPrice: string;
  wholesalePrice: string;
  stock: string;
  image: string;
  categoryId: string;
}

interface Props {
  initial?: Partial<ProductFormData>;
  idReadOnly?: boolean;
  submitLabel: string;
  onSubmit: (data: ProductFormData) => Promise<{ error?: string }>;
  onDelete?: () => Promise<void>;
  saving: boolean;
}

const empty: ProductFormData = {
  id: "",
  name: "",
  description: "",
  retailPrice: "",
  wholesalePrice: "",
  stock: "0",
  image: "",
  categoryId: "",
};

export function ProductForm({
  initial,
  idReadOnly,
  submitLabel,
  onSubmit,
  onDelete,
  saving,
}: Props) {
  const { token } = useAuth();
  const [form, setForm] = useState<ProductFormData>({ ...empty, ...initial });
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      });
  }, [token]);

  function set(field: keyof ProductFormData) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await onSubmit(form);
    if (result.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">
          Información del producto
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {idReadOnly && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                ID (cod_prod)
              </label>
              <input
                value={form.id}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-400 focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Categoría
            </label>
            <select
              value={form.categoryId}
              onChange={set("categoryId")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Nombre *
            </label>
            <input
              required
              value={form.name}
              onChange={set("name")}
              placeholder="Nombre del producto"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="Descripción opcional"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">
          Precios y stock
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Precio minorista *
            </label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.retailPrice}
              onChange={set("retailPrice")}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Precio mayorista *
            </label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.wholesalePrice}
              onChange={set("wholesalePrice")}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Stock *
            </label>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={set("stock")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Imagen</h2>
        <input
          type="url"
          value={form.image}
          onChange={set("image")}
          placeholder="https://..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
        {form.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.image}
            alt="preview"
            className="mt-3 h-24 w-24 rounded-xl object-cover ring-1 ring-gray-100"
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        {onDelete ? (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                ¿Confirmar eliminación?
              </span>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Sí, eliminar
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
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar producto
            </button>
          )
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

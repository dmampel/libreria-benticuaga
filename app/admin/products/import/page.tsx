"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"

interface ImportSummary {
  created: number
  updated: number
  errors: number
  errorDetails: { row: number; reason: string }[]
}

export default function AdminProductImportPage() {
  const { token } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState("")

  async function handleImport() {
    if (!file || !token) return
    setLoading(true)
    setError("")
    setSummary(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setSummary({ created: data.created, updated: data.updated, errors: data.errors, errorDetails: data.errorDetails ?? [] })
        setFile(null)
        if (fileRef.current) fileRef.current.value = ""
      } else {
        setError(data.error ?? "Error al importar")
      }
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Importar CSV</h1>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Format reference */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Formato esperado</h2>
          <pre className="overflow-x-auto rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
{`cod_prod,desc,precio1,precio2,stk,img_url
P001,Notebook A4,5.50,4.50,150,https://...
P002,Blue Pen,1.20,0.95,1000,https://...`}
          </pre>
          <ul className="mt-3 space-y-1 text-xs text-gray-500">
            <li><span className="font-medium text-gray-700">precio2</span> (mayorista) debe ser menor a <span className="font-medium text-gray-700">precio1</span> (minorista)</li>
            <li>Si el producto ya existe, se actualiza. Si no, se crea.</li>
            <li>Filas con error se omiten; el resto se procesa igual.</li>
          </ul>
        </div>

        {/* Upload */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Seleccionar archivo</h2>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border file:border-gray-200 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-600 hover:file:bg-gray-50"
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Importando…" : "Importar"}
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Resultado</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{summary.created}</p>
                <p className="text-xs text-green-600">Creados</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{summary.updated}</p>
                <p className="text-xs text-blue-600">Actualizados</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{summary.errors}</p>
                <p className="text-xs text-red-600">Errores</p>
              </div>
            </div>
            {summary.errorDetails.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Detalle de errores:</p>
                <ul className="space-y-1">
                  {summary.errorDetails.map((e, i) => (
                    <li key={i} className="text-xs text-red-600">
                      Fila {e.row}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

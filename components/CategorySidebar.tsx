"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export default function CategorySidebar() {
  const searchParams = useSearchParams()
  const currentSlug = searchParams.get("category")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.data)
      })
  }, [])

  return (
    <aside className="w-64 shrink-0">
      <nav className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Categorías
        </p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/products"
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                !currentSlug
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">🛍️</span>
              Ver todo
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/products?category=${cat.slug}`}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  currentSlug === cat.slug
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

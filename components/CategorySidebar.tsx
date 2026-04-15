"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  parentId: string | null
  children?: Category[]
}

interface Props {
  basePath?: string
}

export default function CategorySidebar({ basePath = "/products" }: Props) {
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
              href={basePath}
              scroll={false}
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
          {categories.filter(c => !c.parentId).map((cat) => {
            const isActiveParent = currentSlug === cat.slug;
            const isChildActive = cat.children?.some(c => c.slug === currentSlug);
            const shouldBeOpen = isActiveParent || isChildActive;

            return (
              <li key={cat.id} className="group relative">
                <Link
                  href={`${basePath}?category=${cat.slug}`}
                  scroll={false}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActiveParent || isChildActive
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat.icon && <span className="text-base">{cat.icon}</span>}
                  {cat.name}
                  {cat.children && cat.children.length > 0 && (
                    <span className="ml-auto text-xs opacity-50 group-hover:opacity-100 transition-opacity">▼</span>
                  )}
                </Link>

                {/* Subcategorías desplegables en hover */}
                {cat.children && cat.children.length > 0 && (
                  <ul className={`ml-8 mt-1 space-y-1 overflow-hidden transition-all duration-200 ${shouldBeOpen ? "block" : "hidden group-hover:block"}`}>
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`${basePath}?category=${child.slug}`}
                          scroll={false}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                            currentSlug === child.slug
                              ? "font-semibold text-blue-600 bg-blue-50"
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  )
}

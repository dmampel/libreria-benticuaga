"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"

interface SearchResults {
  products: {
    id: string
    name: string
    retailPrice: number
    image: string
    brand: { name: string } | null
  }[]
  brands: {
    id: string
    name: string
    image: string | null
  }[]
  categories: {
    id: string
    name: string
    slug: string
  }[]
}

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 1. URL Sync: Keep grid updated as user types (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query) {
        params.set("q", query)
      } else {
        params.delete("q")
      }

      // Only push if the query actually changed in the URL
      if (params.get("q") !== (searchParams.get("q") || "")) {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, pathname, router, searchParams])

  // 2. Autocomplete: Show dropdown results
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.data)
        setIsOpen(true)
      } catch {
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery("")
  }, [])

  function navigate(href: string) {
    close()
    router.push(href)
  }

  const hasResults =
    results &&
    (results.products.length > 0 ||
      results.brands.length > 0 ||
      results.categories.length > 0)

  return (
    <div ref={wrapperRef} className="relative mb-8 w-full">
      <form action="/products" method="get" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" name="q" value={query} readOnly />

        <div
          className={`flex w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
            isOpen
              ? "border-amber-400 ring-2 ring-amber-400 shadow-md"
              : "border-gray-200 ring-1 ring-gray-100 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
            onFocus={() => query.length >= 2 && results && setIsOpen(true)}
            placeholder="Buscar productos, marcas..."
            autoComplete="off"
            className="flex-1 bg-transparent px-5 py-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />

          <button
            type="button"
            className="flex items-center gap-2 bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            )}
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>
      </form>

      {/* Dropdown UI */}
      {isOpen && results && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[480px] overflow-hidden rounded-2xl border border-gray-100 bg-white/95 shadow-xl backdrop-blur-md">
          {!hasResults ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="flex flex-col">
              {/* COMPACT SECTION: Brands & Categories as horizontal chips */}
              {(results.brands.length > 0 || results.categories.length > 0) && (
                <div className="border-b border-gray-100 bg-gray-50/50 p-3">
                  <div className="scrollbar-hide flex flex-wrap gap-2">
                    {/* Brands as Chips */}
                    {results.brands.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => navigate(`/products?brand=${b.id}`)}
                        className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-medium text-amber-700 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-50"
                      >
                        {b.image && (
                          <div className="relative h-4 w-4 overflow-hidden rounded-full border border-gray-100 bg-white">
                            <Image src={b.image} alt="" fill className="object-contain" />
                          </div>
                        )}
                        <span>{b.name}</span>
                      </button>
                    ))}

                    {/* Categories as Chips */}
                    {results.categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/products?category=${c.slug}`)}
                        className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-medium text-violet-700 shadow-sm transition-all hover:border-violet-400 hover:bg-violet-50"
                      >
                        <span className="text-[10px]">📁</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUCTS SECTION: Vertical list */}
              <div className="max-h-[300px] overflow-y-auto">
                <div className="px-4 pb-1 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Productos</span>
                </div>
                <ul>
                  {results.products.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-amber-50/50"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                        <Image src={p.image} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{p.name}</p>
                        {p.brand && <p className="text-[10px] text-gray-400">{p.brand.name}</p>}
                      </div>
                      <span className="shrink-0 text-sm font-bold text-gray-900">${p.retailPrice.toFixed(2)}</span>
                    </li>
                  ))}
                  
                  {/* View all button */}
                  <li className="border-t border-gray-50 p-2 text-center">
                     <button
                        onClick={() => navigate(`/products?q=${encodeURIComponent(query)}`)}
                        className="w-full py-1 text-[11px] font-semibold text-gray-400 hover:text-amber-600 transition-colors"
                      >
                        Ver todos los resultados →
                      </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

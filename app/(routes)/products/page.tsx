import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import ProductCard from "@/components/ProductCard"
import CategorySidebar from "@/components/CategorySidebar"
import { normalizeText } from "@/lib/utils/normalize"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ category?: string; brand?: string; q?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, brand, q: qRaw } = await searchParams
  const q = normalizeText(qRaw)

  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category: { slug: category } } : {}),
      ...(brand ? { brandId: brand } : {}),
      ...(q
        ? {
            OR: [
              { searchName: { contains: q, mode: "insensitive" } },
              { searchDescription: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { category: true, brand: true },
  })

  const title = brand
    ? (products[0]?.brand?.name ?? "Marca")
    : category
      ? (products[0]?.category?.name ?? "Categoría")
      : "Productos"

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <Suspense fallback={<div className="w-64 shrink-0" />}>
          <CategorySidebar />
        </Suspense>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {products.length} {products.length === 1 ? "producto" : "productos"} disponibles
            </p>
          </div>

          {/* Empty state */}
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-24 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-gray-500">No hay productos en esta categoría.</p>
              {!category && (
                <p className="mt-1 text-xs text-gray-400">
                  Importá productos usando el endpoint <code className="font-mono">/api/upload-csv</code>.
                </p>
              )}
            </div>
          )}

          {/* Product grid */}
          {products.length > 0 && (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} priority={index < 4} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

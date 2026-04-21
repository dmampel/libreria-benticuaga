import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import CategorySidebar from "@/components/CategorySidebar";
import { normalizeText } from "@/lib/utils/normalize";
import Hero from "@/components/Hero";
import BrandsCarousel from "@/components/BrandsCarousel";
import SearchBar from "@/components/SearchBar";
import { getAllBrands } from "@/lib/brands";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string; brand?: string; q?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, brand, q: qRaw } = await searchParams;
  const q = normalizeText(qRaw);

  let categoryFilter = {};
  if (category) {
    const foundCategory = await prisma.category.findUnique({
      where: { slug: category },
      include: { children: true }
    });
    if (foundCategory) {
      const categoryIds = [foundCategory.id, ...foundCategory.children.map(c => c.id)];
      categoryFilter = { categoryId: { in: categoryIds } };
    }
  }

  const [products, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...categoryFilter,
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
    }),
    getAllBrands(),
  ]);

  const title = brand
    ? (products[0]?.brand?.name ?? "Marca")
    : category
      ? (products[0]?.category?.name ?? "Categoría")
      : "Productos";

  return (
    <>
      {/* Full-width Hero */}
      <Hero hideButtons />

      {/* Brands carousel */}
      <BrandsCarousel brands={brands} />

      <div className="mx-auto w-[95%] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          {/* Category sidebar */}
          <div className="hidden sm:block sm:w-64 sm:shrink-0">
            <Suspense
              fallback={
                <div className="h-64 w-64 animate-pulse rounded-2xl bg-gray-100" />
              }
            >
              <CategorySidebar basePath="/products" />
            </Suspense>
          </div>

          {/* Products area */}
          <div className="min-w-0 flex-1">
            {/* Search Bar */}
            <SearchBar />

            {/* Section header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {products.length}{" "}
                {products.length === 1
                  ? "producto disponible"
                  : "productos disponibles"}
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
                <p className="mt-4 text-sm font-medium text-gray-500">
                  No hay productos en esta categoría.
                </p>
              </div>
            )}

            {/* Product grid — 2 cols mobile, 4 cols desktop */}
            {products.length > 0 && (
              <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
    </>
  );
}

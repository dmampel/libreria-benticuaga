import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ProductActions from "@/components/ProductActions"
import { getBrandColor } from "@/lib/brands"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true }
  })

  if (!product) notFound()

  const hasImage = product.image.startsWith("http")

  return (
    <div className="mx-auto w-[95%] px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/products"
        className="font-sans mb-8 inline-flex items-center gap-1.5 text-lg text-gray-500 transition-colors hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver a la tienda
      </Link>

      {/* Detail grid: image left / info right on desktop */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
          {hasImage ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg
                className="h-24 w-24 text-gray-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M5.25 21V3.75A.75.75 0 016 3h12a.75.75 0 01.75.75V21"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6 font-sans">
          {product.brand?.name && (
            <div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm ${getBrandColor(product.brand.name)}`}>
                {product.brand.name}
              </span>
            </div>
          )}

          {/* Name */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 lg:text-4xl">
            {product.name}
          </h1>

          {/* Description */}
          {product.description && (
            <p className="text-base leading-relaxed text-gray-600">{product.description}</p>
          )}

          <hr className="border-gray-100" />

          {/* Price (role-based) + quantity selector + Add to cart */}
          <ProductActions product={product} />
        </div>
      </div>
    </div>
  )
}

import Image from "next/image";
import Link from "next/link";
import type { BrandData } from "@/lib/brands";

interface Props {
  brands: BrandData[];
}

// Colored palette for hover tooltip labels
const LABEL_COLORS = [
  "bg-pink-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-orange-500",
];

/**
 * BrandsCarousel — Horizontal scrollable row.
 * Single line of circular logos, scrollable by mouse/touch.
 * Brand name appears as colored tooltip on hover.
 */
export default function BrandsCarousel({ brands }: Props) {
  if (brands.length === 0) return null;

  return (
    <section className="bg-white py-5">
      <div className="relative">
        {/* Fade masks on edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />

        {/* Scrollable track — hidden scrollbar */}
        <div className="scrollbar-hide overflow-x-auto px-4 pb-10 pt-2 sm:px-6 lg:px-8">
          <div className="flex w-max gap-5">
            {brands.map((brand, idx) => {
              const labelColor = LABEL_COLORS[idx % LABEL_COLORS.length];
              return (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.id}`}
                  scroll={false}
                  aria-label={`Ver productos de ${brand.name}`}
                  className="group relative shrink-0"
                >
                  {/* Circular logo */}
                  {brand.image ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-gray-100 shadow-md ring-1 ring-gray-200/60 transition-all duration-300 group-hover:scale-120 group-hover:shadow-xl">
                      <Image
                        src={brand.image}
                        alt={brand.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50 shadow-md ring-1 ring-gray-200/60 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                      <span className="text-2xl font-black text-gray-400">
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Tooltip — aparece en hover */}
                  <span
                    className={`pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold text-white opacity-0 shadow transition-all duration-200 group-hover:-bottom-8 group-hover:opacity-100 ${labelColor}`}
                  >
                    {brand.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parentId: string | null;
}

// Gradient palette for categories — cycles through if more than defined
const CATEGORY_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-pink-400 to-rose-600",
  "from-slate-600 to-slate-800",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-purple-700",
  "from-cyan-400 to-sky-600",
  "from-red-400 to-rose-600",
  "from-lime-400 to-green-600",
  "from-fuchsia-400 to-pink-600",
  "from-indigo-400 to-blue-700",
  "from-yellow-400 to-amber-600",
  "from-teal-400 to-emerald-600",
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const parentCats = data.data.filter((c: Category) => c.parentId === null);
          setCategories(parentCats);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-2 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-widest text-gray-400">
        ¿Qué estás buscando?
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat, idx) => {
          const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              id={`category-card-${cat.slug}`}
              className="group relative flex h-48 flex-col items-start justify-end overflow-hidden rounded-2xl p-5 shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              {/* Background Layer: Image or Gradient */}
              {cat.image ? (
                <>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Overlay for readability */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent transition-opacity duration-300 group-hover:opacity-80`}
                  />
                </>
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
                />
              )}

              {/* Icon */}
              {cat.icon && (
                <span className="absolute right-4 top-4 text-4xl opacity-30 shadow-white transition-all duration-300 group-hover:scale-125 group-hover:opacity-60 grayscale group-hover:grayscale-0">
                  {cat.icon}
                </span>
              )}

              {/* Name */}
              <div className="relative z-10 w-full">
                <span className="block text-lg font-black uppercase leading-tight tracking-wider text-white drop-shadow-md">
                  {cat.name}
                </span>
                <div className="mt-1 h-1 w-8 rounded-full bg-white/40 transition-all duration-300 group-hover:w-16 group-hover:bg-white" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

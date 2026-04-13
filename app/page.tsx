import Image from "next/image";
import Link from "next/link";
import headerImg from "@/public/header.png";
import logo from "@/public/benticuaga-hero.svg";
import BrandsCarousel from "@/components/BrandsCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import { getAllBrands } from "@/lib/brands";
import TrustSection from "@/components/TrustSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const brands = await getAllBrands();

  return (
    <>
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="bg-white">
        {/* Background image — shown in full, natural proportions */}
        <Image
          src={headerImg}
          alt=""
          priority
          sizes="100vw"
          className="h-auto w-full"
        />

        {/* Center content: logo + buttons */}
        <div className="flex flex-col items-center gap-10 px-4 pb-12 pt-8 sm:pb-14 sm:pt-10">
          <p className="text-2xl text-center font-light text-gray-600">
            ¡Bienvenido a nuestra nueva tienda online!
            <br />
            Te invitamos a explorar nuestro catálogo de productos premium.
          </p>

          {/* CTA buttons + link */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              id="home-register-btn"
              className="rounded-xl bg-violet-400 px-7 py-2.5 text-md font-semibold text-white shadow-md transition-all duration-200 hover:bg-violet-600 hover:shadow-lg active:scale-95"
            >
              Crear una cuenta
            </Link>
            <Link
              href="/auth/login"
              id="home-login-btn"
              className="rounded-xl bg-blue-400 px-7 py-2.5 text-md font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-600 hover:shadow-lg active:scale-95"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/products"
              id="home-products-link"
              className="text-2xl text-gray-700 transition-colors hover:text-blue-600 sm:ml-4 "
            >
              Ir a la tienda →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Brands banner ────────────────────────────────────────── */}
      <BrandsCarousel brands={brands} />

      {/* ─── Category grid ────────────────────────────────────────── */}
      <CategoryGrid />

      {/* ─── Trust / Features section ─────────────────────────────── */}
      <TrustSection />

    </>
  );
}

import Hero from "@/components/Hero";
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
      <Hero />

      {/* ─── Brands banner ────────────────────────────────────────── */}
      <BrandsCarousel brands={brands} />

      {/* ─── Category grid ────────────────────────────────────────── */}
      <CategoryGrid />

      {/* ─── Trust / Features section ─────────────────────────────── */}
      <TrustSection />

    </>
  );
}

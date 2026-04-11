import Image from "next/image"
import AnimatedBlobs from "@/components/AnimatedBlobs"
import TrustBadges from "@/components/TrustBadges"
import logo from "@/public/benticuaga-hero.svg"

/**
 * Hero — premium landing banner with animated blobs, wordmark, and trust badges.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-4 pb-14 pt-16 sm:px-6 sm:pt-20 lg:px-8">
      <AnimatedBlobs />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Wordmark */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <Image
            src={logo}
            alt="Benticuaga Logo"
            width={200}
            height={400}
            priority
            className="h-auto w-auto"
          />
        </div>

        {/* Tagline */}
        <p className="mx-auto mb-10 max-w-xl text-base text-slate-500 sm:text-lg">
          Explorá nuestra selección de papelería premium. Mayoristas y minoristas bienvenidos.
        </p>

        {/* Trust badges */}
        <TrustBadges />
      </div>
    </section>
  )
}

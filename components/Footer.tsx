import Link from "next/link";

const links = {
  "ENLACES ÚTILES": [
    { label: "Inicio", href: "/" },
    { label: "Productos", href: "/products" },
    { label: "Mi Cuenta", href: "/account" },
    { label: "Mis Pedidos", href: "/account/orders" },
    { label: "Checkout", href: "/checkout" },
  ],
  COMUNIDAD: [
    { label: "Registrarse", href: "/auth/register" },
    { label: "Iniciar Sesión", href: "/auth/login" },
    { label: "Mayoristas", href: "/auth/register" },
    { label: "Newsletter", href: "#" },
  ],
  EQUIPO: [
    { label: "Sobre Nosotros", href: "#" },
    { label: "Trabaja con Nosotros", href: "#" },
    { label: "Contacto", href: "#" },
    { label: "Políticas de Devolución", href: "#" },
  ],
};

/**
 * Footer — light warm amber/violet pastel, fits the brand's white + amber palette.
 * Server Component.
 */
export default function Footer() {
  return (
    <footer className="relative bg-amber-50 text-gray-800">
      {/* ── Paper-tear SVG divider (white → amber-50) ── */}
      <div className="overflow-hidden leading-[0]" aria-hidden="true">
        <svg
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-20 w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,40 L60,22 L120,48 L180,18 L240,42 L300,20 L360,50
               L420,24 L480,44 L540,16 L600,46 L660,22 L720,52
               L780,20 L840,44 L900,18 L960,48 L1020,24 L1080,50
               L1140,20 L1200,44 L1260,18 L1320,46 L1380,26 L1440,40
               L1440,0 L0,0 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* ── Newsletter CTA band ── */}
      <div className="relative border-b border-amber-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-500">
                Newsletter
              </p>
              <h2 className="text-xl font-extrabold leading-snug text-gray-900">
                Novedades, ofertas y{" "}
                <span className="italic text-violet-500">mucho papel</span>
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Suscribite y recibí las últimas novedades en tu bandeja de
                entrada.
              </p>
            </div>

            <form
              action="#"
              method="post"
              className="flex w-full max-w-md gap-2"
            >
              <label htmlFor="footer-email" className="sr-only">
                Tu correo electrónico
              </label>
              <input
                id="footer-email"
                type="email"
                name="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
              >
                Suscribirse
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Main footer body ── */}
      <div className="relative overflow-hidden">
        {/* Subtle dot-grid texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(circle,_#f59e0b_1px,_transparent_1px)] [background-size:28px_28px]"
        />

        {/* Ambient glow blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
          {/* Logo + tagline */}
          <div className="mb-10">
            <p className="text-2xl font-extrabold tracking-tight text-gray-900">
              Benticuaga{" "}
              <span className="font-semibold text-amber-500">LIBRERÍA</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-gray-500">
              Explorá, aprendé y crecé con nuestra selección de productos
            </p>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(links).map(([heading, items]) => (
              <div key={heading}>
                <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-600">
                  {heading}
                </p>
                {/* Pencil-squiggle underline */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 60 8"
                  width="60"
                  height="8"
                  className="mb-4 text-amber-400"
                >
                  <path
                    d="M0,4 C10,0 20,8 30,4 C40,0 50,8 60,4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-600 underline-offset-2 transition-colors decoration-amber-400 hover:text-amber-600 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-amber-200/60" />

          {/* Bottom row */}
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Benticuaga Librería. Todos los
              derechos reservados.
            </p>

            {/* Social icon pills */}
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200 transition-all duration-200 hover:bg-amber-500 hover:text-white hover:ring-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200 transition-all duration-200 hover:bg-blue-500 hover:text-white hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Email */}
              <a
                href="mailto:contacto@benticuaga.com"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200 transition-all duration-200 hover:bg-violet-500 hover:text-white hover:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? ""}`}
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200 transition-all duration-200 hover:bg-green-500 hover:text-white hover:ring-green-500 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gradient accent bar ── */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-violet-500"
      />
    </footer>
  );
}

"use client"

import { useAuth } from "@/lib/hooks/useAuth"
import Link from "next/link"

export default function HeroGreeting({ hideButtons = false }: { hideButtons?: boolean }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="h-10" />

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      {!user ? (
        <p className="md:text-2xl text-lg text-center font-light text-gray-600">
          ¡Bienvenido a nuestra nueva tienda online!
          <br />
          Te invitamos a explorar nuestro catálogo de productos premium.
        </p>
      ) : (
        <p className="text-xl md:text-3xl font-sans text-center text-gray-600">
          ¡Estas devuelta, <span className="text-violet-600 font-semibold">{user.firstName || user.email}</span>!
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {!user && (
          <>
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
          </>
        )}

        {!hideButtons && (
          <Link
            href="/products"
            id="home-products-link"
            className="text-2xl text-gray-700 mt-3 transition-colors hover:text-blue-600 sm:ml-4"
          >
            Ir a la tienda →
          </Link>
        )}
      </div>
    </div>
  )
}

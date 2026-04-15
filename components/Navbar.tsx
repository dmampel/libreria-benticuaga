"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CartSummary from "@/components/CartSummary"
import { useCart } from "@/lib/hooks/useCart"
import { useAuth } from "@/lib/hooks/useAuth"
import Image from "next/image"

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
  if (firstName) return firstName.slice(0, 2).toUpperCase()
  if (email) return email.slice(0, 2).toUpperCase()
  return "?"
}

function getDisplayName(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName} ${lastName}`
  if (firstName) return firstName
  return email ?? ""
}

export default function Navbar() {
  const router = useRouter()
  const { getItemCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const hasItems = getItemCount() > 0

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    setDropdownOpen(false)
    router.push("/products")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-gray-900 hover:text-gray-700"
        >
          <Image
            src="/logo.svg"
            alt="Benticuaga Logo"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Inicio
          </Link>
          <Link
            href="/products"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Tienda
          </Link>

          {/* Auth section */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar with initials */}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {getInitials(user.firstName, user.lastName, user.email)}
                </span>
                <span className="hidden max-w-[140px] truncate sm:block">
                  {getDisplayName(user.firstName, user.lastName, user.email)}
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
                  {/* User info header */}
                  <div className="border-b border-gray-100 px-4 py-2.5">
                    <p className="truncate text-xs font-semibold text-gray-900">
                      {getDisplayName(user.firstName, user.lastName, user.email)}
                    </p>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {user.role === "WHOLESALE" ? "Cuenta mayorista" : "Cuenta minorista"}
                    </p>
                  </div>

                  <div className="py-1">
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 bg-indigo-50 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Panel de Control
                      </Link>
                    )}
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mi Cuenta
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Mis Pedidos
                    </Link>

                    {hasItems && (
                      <Link
                        href="/checkout"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                      >
                        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Finalizar Compra
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg bg-blue-400 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-violet-400 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
              >
                Crear Cuenta
              </Link>
            </>
          )}

          {/* Cart icon + badge only */}
          <CartSummary />
        </div>
      </nav>
    </header>
  )
}

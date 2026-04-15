import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import ConditionalFooter from "@/components/ConditionalFooter"
import ToastContainer from "@/components/ToastContainer"
import { CartProvider } from "@/context/CartContext"
import { AuthProvider } from "@/lib/hooks/useAuth"
import { ToastProvider } from "@/context/ToastContext"
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess"
import CartSidebar from "@/components/CartSidebar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Benticuaga — Librería",
  description: "Tu librería de confianza. Productos de papelería y más.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-gray-50" suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Suspense fallback={null}>
                <ClearCartOnSuccess />
              </Suspense>
              <CartSidebar />
              <main className="flex-1">{children}</main>
              <ConditionalFooter />
            </CartProvider>
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  )
}

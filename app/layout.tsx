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
              {/* Contenedor wrapper con drop-shadow intensificado y la grilla global de cuaderno */}
              <div className="flex-1 relative z-10 drop-shadow-[0_25px_25px_rgba(0,0,0,0.12)] flex flex-col bg-gray-50 overflow-hidden">
                {/* Global Canvas Grid Pattern (Dots + Lines) */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(90deg,transparent_23px,rgba(0,0,0,0.5)_24px),linear-gradient(transparent_23px,rgba(0,0,0,0.5)_24px)] [background-size:24px_24px]" />
                
                <main className="flex-1 relative z-10">
                  {children}
                </main>

                {/* Torn paper bottom border: More exaggerated and irregular path */}
                <svg className="w-full h-8 sm:h-12 block relative z-10" preserveAspectRatio="none" viewBox="0 0 1200 120">
                  <defs>
                    <pattern id="torn-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                      <rect width="24" height="24" fill="#f9fafb" /> {/* Matching bg-gray-50 */}
                      <circle cx="1.5" cy="1.5" r="1.5" fill="#000" opacity="0.05" />
                      <path d="M 24 0 L 24 24 0 24" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <path 
                    d="M0,0 H1200 V60 L1180,115 L1145,55 L1110,105 L1065,45 L1025,110 L990,50 L955,120 L910,40 L885,95 L845,35 L800,110 L760,50 L715,115 L685,45 L640,105 L600,30 L560,115 L525,50 L480,120 L445,45 L400,105 L360,35 L320,110 L285,40 L240,115 L200,50 L160,120 L125,45 L80,110 L40,30 L0,90 Z" 
                    fill="url(#torn-grid)"
                  />
                </svg>
              </div>
              <ConditionalFooter />
            </CartProvider>
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  )
}

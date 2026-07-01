"use client"

import { usePathname } from "next/navigation"
import Footer from "@/components/Footer"
import { useEffect, useRef, useState } from "react"

export default function ConditionalFooter() {
  const pathname = usePathname()
  const [footerHeight, setFooterHeight] = useState(0)
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!footerRef.current) return
    
    // We observe the actual height of the footer so the normal document flow
    // can reserve exactly that much space at the bottom for scrolling.
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setFooterHeight(entries[0].contentRect.height)
      }
    })
    
    observer.observe(footerRef.current)
    return () => observer.disconnect()
  }, [])
  
  if (pathname?.startsWith("/admin")) {
    return null
  }
  
  return (
    <>
      {/* Ghost element that takes up the exact height of the fixed footer allowing normal scrolling */}
      <div style={{ height: footerHeight }} aria-hidden="true" className="w-full shrink-0" />
      
      {/* The actual footer forced to stick at the bottom behind the main content (-z-10) */}
      <div 
        ref={footerRef} 
        className="fixed bottom-0 left-0 w-full -z-10"
      >
        <Footer />
      </div>
    </>
  )
}

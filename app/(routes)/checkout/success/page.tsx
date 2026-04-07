import { Suspense } from "react"
import CheckoutSuccessContent from "./CheckoutSuccessContent"

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-green-500" /></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

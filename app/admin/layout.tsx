import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin-auth"
import { Sidebar } from "@/components/admin/Sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token || !requireAdmin(token).authorized) {
    redirect("/products")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

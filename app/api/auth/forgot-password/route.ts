import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateEmailVerificationToken } from "@/lib/auth"
import { sendPasswordResetEmail } from "@/lib/email"
import { rateLimit, getIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const { allowed, retryAfter } = rateLimit(`forgot-password:${getIp(request)}`, { limit: 3, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Demasiados intentos. Intentá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email requerido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    // Always return success — don't leak whether the email exists
    if (user) {
      const token = generateEmailVerificationToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const resetLink = `${appUrl}/auth/reset-password?token=${token}`

      sendPasswordResetEmail(user.email, resetLink).catch((err) =>
        console.error("[Auth] Failed to send password reset email:", err)
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Auth] Forgot password error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

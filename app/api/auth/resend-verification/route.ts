import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateEmailVerificationToken, sendVerificationEmail } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email requerido" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true })
    }

    const token = generateEmailVerificationToken()
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token },
    })

    sendVerificationEmail(email, token).catch((err) =>
      console.error("[Auth] Resend verification error:", err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Auth] Resend verification error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

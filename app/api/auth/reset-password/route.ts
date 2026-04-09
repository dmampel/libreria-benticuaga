import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 400 })
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Token inválido o ya utilizado" },
        { status: 400 }
      )
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "El link expiró. Solicitá uno nuevo." },
        { status: 400 }
      )
    }

    const hashed = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Auth] Reset password error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Token inválido o ya utilizado" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Auth] Verify email error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    const passwordMatch = await verifyPassword(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Verificá tu email antes de ingresar. Revisá tu bandeja de entrada.", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      )
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    })

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin, token },
    })
  } catch (error) {
    console.error("[Auth] Login error:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

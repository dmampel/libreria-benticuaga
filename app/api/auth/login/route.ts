import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"
import { rateLimit, getIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const { allowed, retryAfter } = rateLimit(`login:${getIp(request)}`, { limit: 10, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Demasiados intentos. Intentá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

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

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "Esta cuenta usa Google para ingresar." },
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

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin,
              firstName: user.firstName ?? undefined, lastName: user.lastName ?? undefined },
    })

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[Auth] Login error:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

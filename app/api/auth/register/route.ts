import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateEmailVerificationToken, sendVerificationEmail } from "@/lib/auth"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CUIT_REGEX = /^\d{11}$/
const VALID_ROLES = ["RETAIL", "WHOLESALE"] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, address, role, cuit, razonSocial } = body

    // Required field validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Formato de email inválido" },
        { status: 400 }
      )
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Rol inválido" },
        { status: 400 }
      )
    }

    // WHOLESALE-specific validation
    const resolvedRole = role ?? "RETAIL"
    if (resolvedRole === "WHOLESALE") {
      if (!razonSocial || !razonSocial.trim()) {
        return NextResponse.json(
          { success: false, error: "La razón social es requerida para cuentas mayoristas" },
          { status: 400 }
        )
      }
      if (!cuit || !CUIT_REGEX.test(cuit)) {
        return NextResponse.json(
          { success: false, error: "El CUIT debe tener exactamente 11 dígitos" },
          { status: 400 }
        )
      }
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "El email ya está registrado" },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const verificationToken = generateEmailVerificationToken()

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: resolvedRole,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        phone: phone ?? null,
        address: address ?? null,
        cuit: resolvedRole === "WHOLESALE" ? cuit : null,
        razonSocial: resolvedRole === "WHOLESALE" ? razonSocial : null,
        emailVerificationToken: verificationToken,
      },
    })

    // Fire-and-forget — don't fail registration if email fails
    sendVerificationEmail(user.email, verificationToken).catch((err) =>
      console.error("[Auth] Failed to send verification email:", err)
    )

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, role: user.role, requiresVerification: true },
      message: "Revisá tu email para verificar tu cuenta antes de ingresar.",
    })
  } catch (error) {
    console.error("[Auth] Register error:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

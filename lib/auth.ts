import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sendEmail } from "@/lib/email"

const BCRYPT_ROUNDS = 12
const JWT_EXPIRY = "7d"

// ============ TYPES ============

export interface TokenPayload {
  id: string
  email: string
  role: string
  isAdmin?: boolean
  firstName?: string
  lastName?: string
}

// ============ PASSWORD ============

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ============ JWT ============

export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY })
}

// ============ EMAIL VERIFICATION ============

export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const url = `${appUrl}/auth/verify-email?token=${token}`

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827; font-size: 20px; margin-bottom: 8px;">Verificá tu email</h2>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
        Hacé clic en el botón para activar tu cuenta en Benticuaga.
      </p>
      <a href="${url}"
         style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none;
                padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Verificar email
      </a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
        Si no creaste una cuenta, ignorá este mensaje. El link expira en 24 horas.
      </p>
    </div>
  `

  await sendEmail(email, "Verificá tu email — Benticuaga", html)
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch {
    return null
  }
}

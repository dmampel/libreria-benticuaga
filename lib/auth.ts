import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const BCRYPT_ROUNDS = 12
const JWT_EXPIRY = "7d"

// ============ TYPES ============

export interface TokenPayload {
  id: string
  email: string
  role: string
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

export function verifyToken(token: string): TokenPayload | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch {
    return null
  }
}

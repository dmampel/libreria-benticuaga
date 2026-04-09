import { verifyToken } from "./auth"

export interface AdminAuthResult {
  authorized: boolean
  userId?: string
}

export function requireAdmin(token: string): AdminAuthResult {
  const payload = verifyToken(token)
  if (!payload || !payload.isAdmin) {
    return { authorized: false }
  }
  return { authorized: true, userId: payload.id }
}

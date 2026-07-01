import { NextRequest } from "next/server"
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

export function requireAdminFromRequest(request: NextRequest): AdminAuthResult {
  const token = request.cookies.get("auth_token")?.value
  return token ? requireAdmin(token) : { authorized: false }
}

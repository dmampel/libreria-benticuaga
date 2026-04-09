import { NextRequest, NextResponse } from "next/server"

const TOKEN_KEY = "auth_token"

interface DecodedToken {
  id?: string
  email?: string
  isAdmin?: boolean
  exp?: number
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const base64 = token.split(".")[1]
    if (!base64) return null
    const padded = base64.replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as DecodedToken
  } catch {
    return null
  }
}

function isTokenValid(decoded: DecodedToken): boolean {
  if (!decoded.id || !decoded.email) return false
  if (decoded.exp && decoded.exp * 1000 < Date.now()) return false
  return true
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(TOKEN_KEY)?.value

  // ============ ADMIN ROUTES ============
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const decoded = decodeToken(token)
    if (!decoded || !isTokenValid(decoded)) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!decoded.isAdmin) {
      return NextResponse.redirect(new URL("/products", request.url))
    }

    return NextResponse.next()
  }

  // ============ ACCOUNT ROUTES ============
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const decoded = decodeToken(token)
  if (!decoded || !isTokenValid(decoded)) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
}

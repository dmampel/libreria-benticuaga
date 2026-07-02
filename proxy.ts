import { NextRequest, NextResponse } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"

const TOKEN_KEY = "auth_token"

interface VerifiedTokenPayload {
  id: string
  email: string
  isAdmin: boolean
  exp?: number
}

function isVerifiedTokenPayload(payload: JWTPayload): payload is JWTPayload & VerifiedTokenPayload {
  return typeof payload.id === "string" && typeof payload.email === "string"
}

async function verifyAuthToken(token: string): Promise<VerifiedTokenPayload | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  try {
    const encodedSecret = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ["HS256"] })

    if (!isVerifiedTokenPayload(payload)) return null

    return {
      id: payload.id,
      email: payload.email,
      isAdmin: Boolean(payload.isAdmin),
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(TOKEN_KEY)?.value

  // ============ ADMIN ROUTES ============
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const verified = await verifyAuthToken(token)
    if (!verified) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!verified.isAdmin) {
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

  const verified = await verifyAuthToken(token)
  if (!verified) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
}

import { NextRequest, NextResponse } from "next/server"

const TOKEN_KEY = "auth_token"

function isValidToken(token: string): boolean {
  try {
    const base64 = token.split(".")[1]
    if (!base64) return false
    // base64url → base64
    const padded = base64.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"))
    if (!decoded.id || !decoded.email) return false
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return false
    return true
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value

  if (!token || !isValidToken(token)) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("from", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/account/:path*"],
}

import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  if (!token) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    data: {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      isAdmin: payload.isAdmin ?? false,
      firstName: payload.firstName ?? undefined,
      lastName: payload.lastName ?? undefined,
    },
  })
}

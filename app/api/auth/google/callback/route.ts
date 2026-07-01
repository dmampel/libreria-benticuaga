import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateToken } from "@/lib/auth"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const REDIRECT_URI = new URL("/api/auth/google/callback", APP_URL).toString()

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  error?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  given_name: string
  family_name: string
  picture: string
  verified_email: boolean
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })

  return res.json()
}

async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return res.json()
}

function redirectWithError(message: string) {
  return NextResponse.redirect(
    `${APP_URL}/auth/login?error=${encodeURIComponent(message)}`
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return redirectWithError("Inicio de sesión con Google cancelado.")
  }

  if (!code || !state) {
    return redirectWithError("Parámetros inválidos.")
  }

  const savedState = request.cookies.get("google_oauth_state")?.value

  if (!savedState || savedState !== state) {
    return redirectWithError("Estado inválido. Intentá de nuevo.")
  }

  const redirectTo =
    request.cookies.get("google_oauth_redirect")?.value ?? "/products"

  try {
    const tokens = await exchangeCodeForTokens(code)

    if (tokens.error) {
      return redirectWithError("No se pudo autenticar con Google.")
    }

    const googleUser = await getGoogleUserInfo(tokens.access_token)

    if (!googleUser.email) {
      return redirectWithError("No se pudo obtener el email de Google.")
    }

    let user = await prisma.user.findFirst({
      where: {
        googleId: googleUser.id,
      },
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: {
          email: googleUser.email,
        },
      })

      if (user) {
        user = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            googleId: googleUser.id,
            emailVerified: user.emailVerified ?? new Date(),
          },
        })
      } else {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.id,
            firstName: googleUser.given_name ?? null,
            lastName: googleUser.family_name ?? null,
            role: "RETAIL",
            emailVerified: new Date(),
          },
        })
      }
    }

    if (!user.isActive) {
      return redirectWithError("Tu cuenta está suspendida.")
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    })

    const response = NextResponse.redirect(`${APP_URL}${redirectTo}`)

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    response.cookies.delete("google_oauth_state")
    response.cookies.delete("google_oauth_redirect")

    return response
  } catch (err) {
    console.error("[Auth] Google callback error:", err)
    return redirectWithError("Error interno. Intentá de nuevo.")
  }
}
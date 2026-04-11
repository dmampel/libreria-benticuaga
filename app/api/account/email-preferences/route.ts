import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

function getUser(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  const payload = getUser(request)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  try {
    const prefs = await prisma.emailPreferences.findUnique({ where: { userId: payload.id } })

    if (!prefs) {
      // Return defaults — user hasn't customised yet
      return NextResponse.json({
        success: true,
        data: { orderConfirmation: true, orderUpdates: true, promotions: false, newsletter: false },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        orderConfirmation: prefs.orderConfirmation,
        orderUpdates: prefs.orderUpdates,
        promotions: prefs.promotions,
        newsletter: prefs.newsletter,
      },
    })
  } catch (error) {
    console.error("[EmailPreferences] GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const payload = getUser(request)
  if (!payload) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { orderConfirmation, orderUpdates, promotions, newsletter } = body

    // Validate booleans
    const data: Record<string, boolean> = {}
    if (typeof orderConfirmation === "boolean") data.orderConfirmation = orderConfirmation
    if (typeof orderUpdates === "boolean") data.orderUpdates = orderUpdates
    if (typeof promotions === "boolean") data.promotions = promotions
    if (typeof newsletter === "boolean") data.newsletter = newsletter

    const prefs = await prisma.emailPreferences.upsert({
      where: { userId: payload.id },
      create: { userId: payload.id, ...data },
      update: data,
    })

    return NextResponse.json({
      success: true,
      data: {
        orderConfirmation: prefs.orderConfirmation,
        orderUpdates: prefs.orderUpdates,
        promotions: prefs.promotions,
        newsletter: prefs.newsletter,
      },
    })
  } catch (error) {
    console.error("[EmailPreferences] PATCH error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

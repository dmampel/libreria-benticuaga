import { NextRequest, NextResponse } from "next/server"

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "benticuaga-n8n-secret-2026"
const N8N_WEBHOOK_URL = process.env.N8N_WHATSAPP_WEBHOOK_URL ?? "http://localhost:5678/webhook/whatsapp-assistant"

// Meta webhook verification
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode")
  const token = request.nextUrl.searchParams.get("hub.verify_token")
  const challenge = request.nextUrl.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// Forward incoming WhatsApp messages to n8n
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WhatsApp webhook] Error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

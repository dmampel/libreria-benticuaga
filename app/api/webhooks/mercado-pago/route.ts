import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendOrderConfirmationEmailWithInvoice } from "@/lib/order-emails"

// ============ Signature verification ============

function verifySignature(request: NextRequest, rawBody: string): boolean {
  // Skip verification in development — sandbox uses different secrets
  if (process.env.NODE_ENV !== "production") {
    return true
  }

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[MP Webhook] MERCADO_PAGO_WEBHOOK_SECRET not set — skipping verification")
    return true
  }

  const xSignature = request.headers.get("x-signature")
  const xRequestId = request.headers.get("x-request-id") ?? ""

  // IPN notifications (legacy) have no x-signature — allow them through
  if (!xSignature) {
    console.log("[MP Webhook] No x-signature header — treating as IPN notification")
    return true
  }

  // Parse ts and v1 from "ts=<timestamp>,v1=<hash>"
  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => part.split("=") as [string, string])
  )
  const ts = parts["ts"] ?? ""
  const v1 = parts["v1"] ?? ""
  if (!ts || !v1) {
    console.warn("[MP Webhook] Malformed x-signature header")
    return false
  }

  // Extract data.id from the body
  let dataId = ""
  try {
    const body = JSON.parse(rawBody) as { data?: { id?: string } }
    dataId = body.data?.id ?? ""
  } catch {
    return false
  }

  // Signed template: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hash = createHmac("sha256", secret).update(template).digest("hex")

  if (hash !== v1) {
    console.warn("[MP Webhook] Signature mismatch — possible tampered request")
    return false
  }

  return true
}

// ============ POST /api/webhooks/mercado-pago ============

export async function POST(request: NextRequest): Promise<NextResponse> {
  let rawBody = ""

  try {
    rawBody = await request.text()

    if (!verifySignature(request, rawBody)) {
      console.warn("[MP Webhook] Invalid signature — rejecting request")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(rawBody) as {
      type?: string
      action?: string
      data?: { id?: string }
    }

    console.log(`[MP Webhook] Event: type=${body.type} action=${body.action}`)

    // Only process payment events
    if (body.type !== "payment") {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    // Fetch payment details from MP to get external_reference and status
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error("[MP Webhook] MERCADO_PAGO_ACCESS_TOKEN not set")
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 503 })
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!mpRes.ok) {
      console.error(`[MP Webhook] Failed to fetch payment ${paymentId}: ${mpRes.status}`)
      return NextResponse.json({ received: true }) // return 200 so MP doesn't retry
    }

    const payment = (await mpRes.json()) as {
      id?: string | number
      status?: string
      external_reference?: string
    }

    const orderId = payment.external_reference
    const paymentStatus = payment.status
    const mpPaymentId = String(payment.id ?? paymentId)

    console.log(`[MP Webhook] Payment ${mpPaymentId} | status=${paymentStatus} | orderId=${orderId}`)

    if (!orderId) {
      return NextResponse.json({ received: true })
    }

    // Update order status based on payment result
    if (paymentStatus === "approved") {
      const confirmedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED", transactionId: mpPaymentId, confirmationEmailSent: true },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      })

      const recipientEmail = confirmedOrder.user?.email ?? confirmedOrder.guestEmail ?? null
      console.log(`[MP Webhook] Order ${orderId} → CONFIRMED (tx: ${mpPaymentId})`)
      console.log(`[MP Webhook] Recipient email: ${recipientEmail ?? "none — email skipped"}`)
      console.log(`[MP Webhook] Items on order: ${confirmedOrder.items.length}`)

      if (recipientEmail) {
        sendOrderConfirmationEmailWithInvoice({
          ...confirmedOrder,
          shippingAddress: confirmedOrder.shippingAddress ?? null,
          trackingNumber: confirmedOrder.trackingNumber ?? null,
          guestEmail: confirmedOrder.guestEmail ?? null,
          guestName: confirmedOrder.guestName ?? null,
        }).catch((err) => console.error("[MP Webhook] Failed to send confirmation email:", err))
      } else {
        console.warn(`[MP Webhook] No email found for order ${orderId} — confirmation email skipped`)
      }
    } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      })
      console.log(`[MP Webhook] Order ${orderId} → CANCELLED (payment ${paymentStatus})`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[MP Webhook] Fatal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

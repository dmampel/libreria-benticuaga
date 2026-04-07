import { MercadoPagoConfig, Preference } from "mercadopago"

// ============ Types ============

export interface MpItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
}

export interface CreatePreferenceParams {
  items: MpItem[]
  externalReference: string // our Order ID
  backUrls: {
    success: string
    failure: string
    pending: string
  }
  notificationUrl: string
}

export interface PreferenceResult {
  preferenceId: string
  checkoutUrl: string // sandbox_init_point in dev, init_point in prod
}

// ============ Client ============

function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set")
  return new MercadoPagoConfig({ accessToken })
}

// ============ Create Preference ============

export async function createPreference(
  params: CreatePreferenceParams
): Promise<PreferenceResult> {
  const client = getClient()
  const preference = new Preference(client)

  const response = await preference.create({
    body: {
      items: params.items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id ?? "ARS",
      })),
      external_reference: params.externalReference,
      back_urls: params.backUrls,
      auto_return: "approved",
      notification_url: params.notificationUrl,
    },
  })

  if (!response.id) throw new Error("Mercado Pago did not return a preference ID")

  // Use sandbox_init_point when not in production
  const isProd = process.env.NODE_ENV === "production"
  const checkoutUrl = isProd
    ? (response.init_point ?? "")
    : (response.sandbox_init_point ?? response.init_point ?? "")

  return {
    preferenceId: response.id,
    checkoutUrl,
  }
}

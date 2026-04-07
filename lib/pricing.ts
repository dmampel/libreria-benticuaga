import type { Role } from "@prisma/client"

interface PricedProduct {
  retailPrice: number
  wholesalePrice: number
}

/**
 * Returns the correct unit price for a product based on the user's role.
 * Defaults to retailPrice if role is undefined or unrecognised.
 */
export function getPrice(product: PricedProduct, role: Role = "RETAIL"): number {
  return role === "WHOLESALE" ? product.wholesalePrice : product.retailPrice
}

/**
 * Human-readable label for the active pricing tier.
 */
export function getPriceLabel(role: Role): string {
  return role === "WHOLESALE" ? "Mayorista" : "Minorista"
}

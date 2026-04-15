export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Pago confirmado",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PREPARING: "bg-orange-50 text-orange-700",
  SHIPPED: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
}

export const ACTION_LABELS: Record<string, string> = {
  product_created: "Producto creado",
  product_updated: "Producto actualizado",
  product_deleted: "Producto eliminado",
  category_created: "Categoría creada",
  category_updated: "Categoría actualizada",
  category_deleted: "Categoría eliminada",
  order_updated: "Pedido actualizado",
  user_updated: "Usuario actualizado",
  csv_import: "Importación CSV",
}

export const ACTION_COLORS: Record<string, string> = {
  product_created: "bg-green-50 text-green-700",
  product_updated: "bg-blue-50 text-blue-700",
  product_deleted: "bg-red-50 text-red-700",
  category_created: "bg-green-50 text-green-700",
  category_updated: "bg-blue-50 text-blue-700",
  category_deleted: "bg-red-50 text-red-700",
  order_updated: "bg-purple-50 text-purple-700",
  user_updated: "bg-amber-50 text-amber-700",
  csv_import: "bg-indigo-50 text-indigo-700",
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

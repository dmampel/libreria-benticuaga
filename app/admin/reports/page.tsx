"use client"

import { useRouter } from "next/navigation"

const REPORT_CARDS = [
  {
    href: "/admin/reports/sales",
    title: "Ventas",
    description: "Tendencia de ingresos, órdenes por día y desglose por período.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    href: "/admin/reports/inventory",
    title: "Inventario",
    description: "Productos sin stock, stock bajo, más vendidos y menos vendidos.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/admin/activity-log",
    title: "Log de Actividad",
    description: "Auditoría completa de acciones realizadas por administradores.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "bg-green-50 text-green-600",
  },
]

export default function ReportsPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">Análisis de ventas, inventario y auditoría de actividad.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 text-left transition-shadow hover:shadow-md"
          >
            <div className={`mb-4 inline-flex rounded-xl p-3 ${card.color}`}>
              {card.icon}
            </div>
            <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {card.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{card.description}</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600">
              Ver reporte
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

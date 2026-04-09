interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    label: string
    positive?: boolean
  }
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trend.positive ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              {trend.label}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

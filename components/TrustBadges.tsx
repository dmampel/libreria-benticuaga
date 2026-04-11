/**
 * TrustBadges — Simple, colorful cards for brand trust.
 */
export default function TrustBadges() {
  const badges = [
    {
      title: "Envíos",
      subtitle: "A todo el país",
      color: "bg-amber-200 text-amber-900",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
    {
      title: "Garantía",
      subtitle: "30 días de cambio",
      color: "bg-indigo-200 text-indigo-900",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Atención 24hs",
      subtitle: "Asesoría gratuita",
      color: "bg-rose-200 text-rose-900",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-3">
      {badges.map((badge, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-3 rounded-2xl ${badge.color} px-4 py-3 shadow-sm transition-transform active:scale-95`}
        >
          <div className="bg-white/50 rounded-full p-2">
            {badge.icon}
          </div>
          <div className="text-left">
            <p className="text-sm font-light leading-tight">{badge.title}</p>
            <p className="text-[10px] opacity-80 uppercase tracking-wider font-light">
              {badge.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

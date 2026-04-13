/**
 * AnimatedBlobs — decorative background blobs for Hero.
 * Server Component: pure CSS animation via globals.css `.animate-float`.
 */
export default function AnimatedBlobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Red blob — top-left */}
      <div
        className="animate-float absolute -left-20 -top-20 h-80 w-80 rounded-full bg-red-400 opacity-70 blur-3xl"
        style={{ "--float-duration": "5s", "--float-delay": "0s" } as React.CSSProperties}
      />
      {/* Teal blob — top-right */}
      <div
        className="animate-float absolute -right-24 top-10 h-64 w-64 rounded-full bg-teal-400 opacity-70 blur-3xl"
        style={{ "--float-duration": "6s", "--float-delay": "0.8s" } as React.CSSProperties}
      />
      {/* Magenta blob — center-bottom-left */}
      <div
        className="animate-float absolute -bottom-16 left-1/4 h-72 w-72 rounded-full bg-pink-400 opacity-70 blur-3xl"
        style={{ "--float-duration": "7s", "--float-delay": "1.6s" } as React.CSSProperties}
      />
      {/* Yellow blob — center-top */}
      <div
        className="animate-float absolute left-1/2 top-4 h-48 w-48 -translate-x-1/2 rounded-full bg-yellow-300 opacity-70 blur-3xl"
        style={{ "--float-duration": "4.5s", "--float-delay": "0.4s" } as React.CSSProperties}
      />
      {/* Cyan blob — bottom-right */}
      <div
        className="animate-float absolute -bottom-10 -right-16 h-60 w-60 rounded-full bg-cyan-400 opacity-70 blur-3xl"
        style={{ "--float-duration": "5.5s", "--float-delay": "1.2s" } as React.CSSProperties}
      />
    </div>
  )
}

import { NextRequest } from "next/server"

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Purge expired entries every 5 minutes to avoid unbounded growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfter: number // seconds until reset; 0 when allowed
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= config.limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

export function getIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded ? forwarded.split(",")[0].trim() : "unknown"
}

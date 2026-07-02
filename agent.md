# agent.md — Librería Benticuaga

## Estado Actual
**Última sesión:** 2026-07-01
**Estado:** En producción (deployed). Performance optimizada post-primer-deploy.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15+ (App Router) |
| ORM | Prisma 6+ |
| Base de datos | PostgreSQL via Supabase (solo DB_URL, no Supabase Auth) |
| Estilos | Tailwind CSS 3+ |
| Auth | Custom JWT + bcrypt + httpOnly cookie |
| Google OAuth | Flow manual con fetch (sin NextAuth) |
| Pagos | Mercado Pago |
| Email | Resend |
| WhatsApp | API oficial de Meta |
| Automatización | n8n |
| Rate limiting | In-memory sliding window (lib/rate-limit.ts) |

---

## Arquitectura de Auth

- JWT firmado con `JWT_SECRET`, guardado en **httpOnly cookie** (`auth_token`)
- Password **nullable** en DB (usuarios Google no tienen password)
- Google OAuth manual: `app/api/auth/google/route.ts` → redirect → `app/api/auth/google/callback/route.ts`
- CSRF state via cookie temporal `google_oauth_state`
- Hook cliente: `lib/hooks/useAuth.ts` → llama a `/api/auth/me`
- Rate limiting en: login, register, forgot-password, resend-verification

---

## Decisiones Importantes

### 2026-07-01 — Performance optimization (post-deploy)
**Problema:** La página andaba muy lenta en producción.
**Causa raíz:** `unoptimized: true` en `next.config.ts` deshabilitaba el motor de imágenes de Next.js.
**Soluciones aplicadas:**
1. Eliminado `unoptimized: true` → Next.js ahora convierte a WebP y redimensiona
2. Home page: `force-dynamic` → `revalidate = 3600` (cache de 1 hora)
3. Hero refactorizado: sacado `cookies()` server-side que bloqueaba el caché → nuevo `HeroGreeting.tsx` client component que usa `useAuth`
4. Paginación en productos: `take: 48, skip` + UI con ellipsis. Antes traía TODOS los productos sin límite.

### Auth migrada a httpOnly cookie
JWT dejó de vivir en localStorage → httpOnly cookie server-side. Supabase solo como host PostgreSQL.

---

## Estructura Clave

```
app/
  (routes)/products/page.tsx   ← paginación de 48 productos, force-dynamic
  page.tsx                     ← home, revalidate=3600
  api/auth/                    ← login, register, google, logout, me, verify-email, etc.
  api/admin/                   ← panel admin protegido
components/
  Hero.tsx                     ← server component puro (sin cookies)
  HeroGreeting.tsx             ← client component para saludo personalizado
  ProductCard.tsx              ← "use client", usa useCart
lib/
  auth.ts                      ← generateToken, verifyToken
  prisma.ts                    ← singleton prisma client
  rate-limit.ts                ← sliding window in-memory
  hooks/useAuth.ts             ← AuthProvider + useAuth hook
```

---

## Notas del Agente

- **CSV Import**: único método de importar productos (no hay conexión directa con sistema externo)
- **Clientes:** RETAIL (precio1) y WHOLESALE (precio2)
- **Pagos:** Mercado Pago integrado + opción pago en efectivo
- **Sin stock:** se muestra badge "Sin stock" en ProductCard, botón deshabilitado
- **Categorías:** tienen slugs, jerarquía padre/hijo, usadas en filtro de productos
- **Marcas:** tienen colores asignados, carrusel en home y página de productos
- Si agregás más productos y 48 por página queda corto/largo → cambiar `PAGE_SIZE` en `app/(routes)/products/page.tsx`
- La home NO necesita `force-dynamic` porque HeroGreeting lee el usuario en el cliente

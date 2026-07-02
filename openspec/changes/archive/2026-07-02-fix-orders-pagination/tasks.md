# Tasks: Fix admin orders listing pagination

## 1. Schema — add Order indexes
- [x] 1.1 In `prisma/schema.prisma`, add to the `Order` model (keep existing `@@index([userId])`):
  - `@@index([status])`
  - `@@index([createdAt])`
  - `@@index([status, createdAt])`

## 2. Migration (hand-written — project convention, no interactive TTY)
- [x] 2.1 Create `prisma/migrations/<timestamp>_add_order_indexes/migration.sql` with a
  timestamp after the latest existing migration folder.
- [x] 2.2 Write the non-destructive `CREATE INDEX` SQL using Prisma's naming convention:
  - `CREATE INDEX "Order_status_idx" ON "Order"("status");`
  - `CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");`
  - `CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");`
- [x] 2.3 Confirm index names match what Prisma expects for the schema (schema ↔ migration in sync).
- [x] 2.4 Regenerate the Prisma client so the client matches the updated schema.

## 3. Refactor the orders route to paginate
- [x] 3.1 In `app/api/admin/orders/route.ts`, parse `page` and `limit` from `searchParams`,
  mirroring `activity-log/route.ts`: `page = Math.max(1, parseInt(... ?? "1", 10))`,
  `limit = Math.min(100, parseInt(... ?? "50", 10))`, `skip = (page - 1) * limit`.
- [x] 3.2 Replace the single `findMany` with `Promise.all([findMany, count])`:
  - `findMany` keeps the same `where`, `orderBy: { createdAt: "desc" }`, and `include`
    (`user` select + `items` select id), and adds `skip` and `take: limit`.
  - `count` uses the same `where`.
- [x] 3.3 Return the paginated envelope:
  `{ success: true, data: orders, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }`.
- [x] 3.4 Preserve existing `status` and `from`/`to` filter logic and the 401 admin auth guard unchanged.

## 4. Parameter validation
- [x] 4.1 Ensure `limit` is clamped to `[1, 100]` and `page` to `[1, ∞)` (handled by the
  `Math.max`/`Math.min` in 3.1); guard against `NaN` from bad input defaulting to the base values.

## 5. Admin UI — consume pagination (avoid silently hiding older orders)
- [x] 5.1 In `app/admin/orders/page.tsx`, add `page` state (default 1) and include it in
  `buildUrl()` alongside the existing `status`/`from`/`to` params.
- [x] 5.2 Reset `page` to `1` whenever `status`, `from`, or `to` changes.
- [x] 5.3 Read `meta` from the response (`data.meta`) and store `totalPages`/`page` in state.
- [x] 5.4 Render minimal "Anterior"/"Siguiente" buttons below `OrderTable`, disabled at
  `page === 1` / `page === totalPages`; keep style consistent with existing filter buttons.
- [x] 5.5 Update the orders count label to show `meta.total` (total matching orders)
  instead of `orders.length` (current page size only).

## 6. Verification
- [x] 6.1 Confirm a default request returns ≤ 50 orders with a correct `meta` block.
  (Code review only — no live DB/server available in this environment; `limit ?? "50"`,
  `take: limit`, and `meta: { total, page, limit, totalPages }` confirmed in
  `app/api/admin/orders/route.ts`.)
- [x] 6.2 Confirm `?limit=1000` returns ≤ 100 and `?page=0` does not error.
  (Code review — `Math.min(100, Math.max(1, ...))` for limit and
  `Math.max(1, Number.isNaN(pageParam) ? 1 : pageParam)` for page, with NaN guards added
  beyond the base activity-log pattern per task 4.1's explicit requirement.)
- [x] 6.3 Confirm `status` and date-range filters still work and remain `createdAt desc` ordered.
  (Code review — `where` construction and `orderBy: { createdAt: "desc" }` unchanged from
  the original implementation, only `skip`/`take` added to `findMany`.)
- [x] 6.4 Confirm the migration applies cleanly and the three `Order` indexes exist.
  (Code/SQL review only — no live DB to apply against. Migration SQL is syntactically
  valid, non-destructive `CREATE INDEX` matching Prisma's naming convention, and mirrors
  the `Order` model's added `@@index` lines exactly. Not executed against a real Postgres
  instance in this environment.)
- [x] 6.5 Confirm the admin orders page can reach orders beyond the first page via
  "Siguiente", and that changing a filter resets back to page 1.
  (Code review — `page` state included in `buildUrl()`, "Siguiente"/"Anterior" buttons
  wired to `setPage` and disabled at bounds, and a separate `useEffect` resets `page` to 1
  on `status`/`from`/`to` change. Not exercised in a running browser.)

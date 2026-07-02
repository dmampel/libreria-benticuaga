# Design: Fix admin orders listing pagination

## Context

`GET /api/admin/orders` currently (lines ~33-40) does:

```ts
const orders = await prisma.order.findMany({
  where,                      // { status?, createdAt? }
  orderBy: { createdAt: "desc" },
  include: {
    user: { select: { email, firstName, lastName } },
    items: { select: { id } },
  },
})
return NextResponse.json({ success: true, data: orders })
```

No limit, no count, and `where.status` / `where.createdAt` hit an unindexed table
(`Order` has only `@@index([userId])`). Two sibling endpoints already implement the
target pattern and are the reference for style and conventions.

## Reference pattern (existing, to mirror)

From `app/api/admin/users/route.ts` and `app/api/admin/activity-log/route.ts`:

- Params: `page` (default 1), `limit` (default 10 in users, 50 in activity-log).
- **Clamping**: activity-log uses `Math.max(1, parseInt(... ?? "1"))` for page and
  `Math.min(100, parseInt(... ?? "50"))` for limit — this is the safer form and the one
  to adopt here.
- `skip = (page - 1) * limit`.
- Data + count fetched together via `Promise.all([findMany, count])` (activity-log).
- Envelope: `{ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }`.

## Decisions

### D1 — Pagination params and defaults
Adopt `page` default `1`, `limit` default `50`, clamped `limit` to max `100`, min `1`;
`page` min `1`. Rationale: matches activity-log (the stricter of the two references) and
keeps a sane bound for admin browsing. `orderBy: { createdAt: "desc" }` is preserved.

### D2 — Fetch data and count in parallel
Replace the single `findMany` with:

```ts
const [orders, total] = await Promise.all([
  prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { ... } }),
  prisma.order.count({ where }),
])
```

Keep the existing `include` (`user` select + `items` select id) unchanged — scope is
pagination + indexing only, not payload reshaping.

### D3 — Response envelope change + UI update (RESOLVED — in scope)
Response moves from `{ success, data }` to `{ success, data, meta }`. Checked the only
consumer, `app/admin/orders/page.tsx`: it currently fetches with no `page`/`limit` and
renders every order returned, with no pagination controls. Capping the backend at
`limit=50` without touching the UI would silently hide older orders from the admin with
no way to reach them — a real functional regression, not just a shape change.

Decision: bring the UI update into this change's scope.
- `page`/`limit` state added to `AdminOrdersPage`, sent as query params (mirrors the
  existing `status`/`from`/`to` pattern already in `buildUrl()`).
- Read `meta.totalPages`/`meta.page` from the response; render simple
  "Anterior"/"Siguiente" buttons (disabled at bounds) — no full page-number picker,
  keep it minimal and consistent with the rest of the admin UI.
- Reset to `page=1` when filters (`status`/`from`/`to`) change.

### D4 — Order model indexes
Add to `Order` in `prisma/schema.prisma`:

```prisma
@@index([userId])            // existing — keep
@@index([status])
@@index([createdAt])
@@index([status, createdAt]) // common combined admin filter
```

The composite `[status, createdAt]` covers the frequent "filter by status, sorted by
date" admin query; the single-column indexes cover each filter used independently.

### D5 — Migration approach (NEEDS REVIEW — MEDIUM governance)
`prisma migrate dev` requires an interactive TTY that is unavailable in this environment.
Project convention (confirmed in `prisma/migrations/`, e.g.
`20260411174817_add_search_normalization`) is **hand-written migration SQL** using
Prisma's standard `CREATE INDEX "Table_column_idx"` form. Therefore:

- Create `prisma/migrations/<timestamp>_add_order_indexes/migration.sql` by hand:

```sql
-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
```

- This migration is **non-destructive**: it only adds indexes; no columns dropped or
  altered, no data change. Safe to apply online for the current table size.
- Index names must match Prisma's expected convention so the schema and migration stay
  in sync (`Order_status_idx`, `Order_createdAt_idx`, `Order_status_createdAt_idx`).

Governance MEDIUM: the migration is surfaced here explicitly for review before apply.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Admin UI breaks on new `meta` envelope | Med | Verify consumers during apply; envelope is additive (`data` retained) |
| Index name mismatch vs Prisma expectation | Low | Use exact `Order_<col>_idx` names; keep migration + schema in lockstep |
| Migration timestamp/order conflict | Low | Use a timestamp after the latest existing migration folder |

## Rollback Plan

- Code: revert `app/api/admin/orders/route.ts` to the single unbounded `findMany`.
- Schema: remove the three added `@@index` lines from `Order`.
- DB: `DROP INDEX "Order_status_idx"; DROP INDEX "Order_createdAt_idx"; DROP INDEX "Order_status_createdAt_idx";`
  (indexes only — no data affected).

## Success Criteria

- [ ] `GET /api/admin/orders` returns at most `limit` rows and a `meta` block.
- [ ] `page`/`limit` are clamped (limit ≤ 100, page ≥ 1).
- [ ] `Order` has `status`, `createdAt`, and `[status, createdAt]` indexes applied.
- [ ] Filtered queries use the new indexes (no full scan for status/date filters).
- [ ] Pattern matches users/activity-log endpoints.

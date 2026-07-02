# Proposal: Fix admin orders listing pagination

## Why

The admin orders endpoint (`app/api/admin/orders/route.ts`) runs an unbounded
`prisma.order.findMany` — no `take`/`skip`, no `count`, returning **every** matching
order plus relations (`user`, `items`) on each request. It filters by `status` and
`createdAt`, but the `Order` model only has `@@index([userId])`, so those filters do a
full table scan. As order history grows toward the 10,000+ scalability target, every
admin panel load degrades linearly. The project already solves this cleanly in
`app/api/admin/users/route.ts` and `app/api/admin/activity-log/route.ts`; the orders
endpoint is simply inconsistent with that established pattern.

## What Changes

- Add real pagination to the admin orders listing: `page`/`limit` query params,
  `skip`/`take`, and a parallel `count()` via `Promise.all`, mirroring the
  users/activity-log endpoints.
- Return the standard paginated envelope `{ success, data, meta: { total, page, limit, totalPages } }`
  (currently returns `{ success, data }` with no `meta`).
- Validate/clamp `page` (min 1) and `limit` (min 1, max 100) so callers cannot request
  an unbounded page size.
- Add indexes to the `Order` model: `@@index([status])`, `@@index([createdAt])`,
  `@@index([status, createdAt])` (the common combined admin filter). Existing
  `@@index([userId])` is kept.
- Add a hand-written Prisma migration creating those indexes (non-destructive:
  index-only, no columns dropped or altered).
- Update the admin orders UI (`app/admin/orders/page.tsx`) to send `page`/`limit`
  and render basic previous/next pagination controls driven by the new `meta` block.
  Without this, the paginated backend would silently hide older orders from the
  admin with no way to reach them — confirmed the current page fetches everything
  unpaginated and has no pagination UI at all.

Governance: **MEDIUM** (business logic + DB schema). No BREAKING changes.

## Capabilities

### New Capabilities
- `admin-orders-listing`: paginated, indexed admin listing of orders with status and
  date-range filtering and a standard pagination envelope.

### Modified Capabilities
- None (no existing specs under `openspec/specs/`).

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `app/api/admin/orders/route.ts` | Modified | Add pagination, param validation, paginated response envelope |
| `prisma/schema.prisma` (`Order`) | Modified | Add `status`, `createdAt`, `[status, createdAt]` indexes |
| `prisma/migrations/` | New | Hand-written `CREATE INDEX` migration (non-destructive) |
| `app/admin/orders/page.tsx` | Modified | Send `page`/`limit`, read `meta`, add prev/next controls |

Note: the response shape changes from `{ success, data }` to
`{ success, data, meta }`. The admin UI is updated in this same change to consume
`meta` and paginate — resolved during proposal review (2026-07-02), not deferred.

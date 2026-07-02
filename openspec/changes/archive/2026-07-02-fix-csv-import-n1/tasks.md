# Tasks: Fix N+1 Query in CSV Import

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120-180 (single route file, one new constant, no new deps) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Batch the persistence loop in the import route, preserve contract | PR 1 | Single file scope, no external deps, low risk |

## Phase 1: Foundation

- [x] 1.1 Add `BATCH_SIZE = 500` as a named constant at the top of `app/api/admin/products/import/route.ts` (Design Decision 2).
- [x] 1.2 Add a small chunking helper (inline function or `lib/chunk.ts`) that splits `products` (and `ids`) into arrays of at most `BATCH_SIZE` items.

## Phase 2: Core Implementation — Batched Persistence

- [x] 2.1 Add an empty-input short-circuit: if `products.length === 0`, skip all DB writes, still write the activity log, and return `{ success: true, created: 0, updated: 0, errors, errorDetails }` (spec: "Empty or all-invalid input").
- [x] 2.2 Replace the per-row `findUnique` with a single bulk pre-check: chunk all `product.id`s by `BATCH_SIZE` and run `prisma.product.findMany({ where: { id: { in: chunkIds } }, select: { id: true } })` per chunk, collecting existing ids into a `Set<string>`.
- [x] 2.3 Derive `updated = products.filter(p => existingIds.has(p.id)).length` and `created = products.length - updated` from the pre-check set (Design Decision 3). Do not read per-row.
- [x] 2.4 Wrap all batch writes in one `prisma.$transaction(async (tx) => { ... })` interactive transaction so the whole import is atomic (Design Decision 4).
- [x] 2.5 Inside the transaction, chunk `products` by `BATCH_SIZE` and write each chunk as a single batched upsert: use `INSERT ... ON CONFLICT (id) DO UPDATE SET name=..., retailPrice=..., wholesalePrice=..., stock=..., image=...` via `tx.$executeRaw`/`Prisma.sql` with parameterized values (Design Decision 1B). Implemented via Decision 1B (raw SQL); no fallback to 1A needed.
- [x] 2.6 Ensure no row values are string-concatenated into SQL — all values must flow through Prisma's tagged-template bind parameters (`Prisma.sql`/`Prisma.join`).

## Phase 3: Error Handling & Response Contract

- [x] 3.1 On any error thrown during the transaction (batch DB failure), let it propagate to the existing outer `catch` block so the import aborts entirely and the endpoint returns `{ success: false, error: "Error interno" }` with HTTP 500 (spec: "A failing batch aborts the whole import"). Do not catch/continue past a failed batch.
- [x] 3.2 Keep the activity-log write (`prisma.activityLog.create`) exactly as-is, executed only after the transaction commits successfully — move it after the transaction call if not already positioned there.
- [x] 3.3 Keep the final response shape unchanged: `{ success: true, created, updated, errors: errors.length, errorDetails }` (spec: "Response shape is unchanged").
- [x] 3.4 Keep the existing `console.log("[Admin CSV Import] ...")` summary line and the `requireAdminFromRequest` 401 guard untouched (out of scope per design).

## Phase 4: Verification

> No test runner exists in this project. Most items below were verified by static code-scenario analysis against the spec's Given/When/Then. 4.3 was additionally confirmed with a real 10,000-row live import (see below). 4.5 (batch-failure rollback) remains code-verified only — see its note for why a live version is hard to trigger safely.

- [x] 4.1 Code-verified: `existingIds` pre-check + `updated`/`created` derivation logic correctly maps to "Mixed create and update reported correctly"; invalid rows never reach this code (already filtered by `parseCsv`), satisfying "Invalid rows are skipped, valid rows persist".
- [x] 4.2 Code-verified: the `products.length === 0` branch writes the activity log with `created: 0, updated: 0` and returns before any `findMany`/`$transaction` call — zero DB writes to `Product`.
- [x] 4.3 Live-verified: uploaded a real 10,000-row CSV (`smoke-test-10k.csv`) via `/admin/products/import` against the real Supabase DB. Result: `10000 created, 0 updated, 0 errors` in 6.6s total (5.6s application code) — down from an estimated ~20,000 sequential queries under the old per-row loop.
- [x] 4.4 Verified by arithmetic: each row contributes exactly 6 bind parameters (`id, name, retailPrice, wholesalePrice, stock, image`; `NOW()` is a literal, not a parameter) — matches Design Decision 2's "500 rows = 3,000 parameters" exactly, well under the 65,535 limit.
- [x] 4.5 Accepted as code-verified only (user decision): a live failure injection would require deliberately breaking the SQL against production data, which isn't worth the risk given `parseCsv` already filters bad rows before they reach the DB. Structurally, an error thrown inside `prisma.$transaction(async (tx) => {...})` rejects the transaction (Prisma rolls back all statements in it) and rethrows, which is caught by the route's outer `catch`, returning `{ success: false }` / 500.
- [x] 4.6 Code-verified: `requireAdminFromRequest` check is unchanged and still runs first, before any DB access — 401 path is untouched by this change.

## Phase 5: Cleanup

- [x] 5.1 Remove any leftover per-row `findUnique` calls or dead code from the old loop. (Old loop fully replaced; no dead code remains.)
- [x] 5.2 Re-read the final route file against `CLAUDE.md` conventions (no hardcoded literals, explicit types, `{ success, data?, error? }`-style responses, try/catch coverage) and adjust if needed. (`BATCH_SIZE` is a named constant, no `any` used, response shape preserved, entire body remains inside the existing try/catch.)

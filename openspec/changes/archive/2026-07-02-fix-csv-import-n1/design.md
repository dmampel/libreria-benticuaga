## Context

The import route already has a clean separation of concerns: `parseCsv(buffer, filename)` in `lib/csv-parser.ts` performs all parsing and row validation and returns `{ products: ParsedProduct[], errors: CsvRowError[] }`. Invalid rows (missing `cod_prod`, bad prices, `precio2 >= precio1`, in-file duplicate ids, etc.) are already filtered out and logged before the route touches the database. The route's job is purely persistence.

The current persistence loop (route.ts ~26–48) is the bottleneck:

```
for (const product of products) {
  const existing = await prisma.product.findUnique({ where: { id: product.id } })  // round-trip 1
  await prisma.product.upsert({ where: { id }, update: {...}, create: {...} })      // round-trip 2
  if (existing) updated++ else created++
}
```

Two sequential awaits per row × 10,000+ rows = ~20,000 serial queries. The `findUnique` exists only to compute `created` vs `updated` for the summary. The `id` column (from CSV `cod_prod`) is the primary key, so it is the natural conflict target.

Governance level: **MEDIUM** (data pipeline / business logic). Implementable with autonomy and checkpoints; the non-obvious decisions (batch size, partial-failure semantics, count derivation) are made explicit below.

## Goals / Non-Goals

**Goals:**
- Reduce DB round-trips from O(rows) to O(rows / batchSize) for a full import.
- Keep imports within the connection pool budget under a 10,000+ row catalog.
- Preserve the existing response contract `{ success, created, updated, errors, errorDetails }`.
- Preserve row-level fault tolerance: invalid rows are skipped and logged, never fatal.
- Make partial batch-failure behavior explicit and safe (no silent data loss, accurate summary).

**Non-Goals:**
- Changing CSV parsing, validation rules, or `lib/csv-parser.ts` behavior.
- Streaming the CSV upload or changing the multipart intake.
- Changing the `Product` data model or adding new columns.
- Admin-UI changes or progress reporting to the client mid-import.
- Concurrency/locking guarantees for two admins importing simultaneously (out of scope; last-write-wins on conflict is acceptable as today).

## Decisions

### Decision 1: Batch upsert via `INSERT ... ON CONFLICT (id) DO UPDATE` using `$executeRaw`

Chosen over the alternatives for the 10,000+ row target.

- **Alternative A — `prisma.$transaction([upsert, upsert, ...])`**: Cleaner and type-safe, but still emits one SQL statement per row (Prisma has no batched `upsert`). A transaction of 10,000 statements is one round-trip's worth of network but a very large transaction that holds locks and memory. Better than the current code, but not ideal at target scale.
- **Alternative B — `INSERT ... ON CONFLICT (id) DO UPDATE SET ...` with multi-row `VALUES`, chunked**: One statement upserts an entire chunk. Minimal round-trips, native Postgres upsert semantics, matches the `id` primary-key conflict target. Requires raw SQL and careful parameterization.
- **Decision**: Use **B** (chunked `INSERT ... ON CONFLICT`). If implementation friction with `$executeRaw` parameter arrays proves high, **A chunked into transactions of `BATCH_SIZE`** is the accepted fallback — it still removes the N+1 and is a reasonable middle ground. The apply phase may pick A-chunked if B is impractical; either satisfies the spec.

### Decision 2: Batch size = 500 (constant, named)

- Rationale: Postgres has a hard limit of 65,535 bind parameters per statement. With 6 columns per product row, 500 rows = 3,000 parameters — comfortably safe with headroom, while still cutting round-trips by ~500×. 1,000 rows (6,000 params) is also safe but a 500 default is more conservative against future column additions and keeps each statement's memory modest.
- Must be a named constant (`BATCH_SIZE = 500`), not hardcoded inline, per project no-hardcoding standard.
- Alternative considered: dynamic batch sizing by column count — rejected as premature; a fixed conservative constant is simpler and sufficient.

### Decision 3: `created` vs `updated` counts derived by a single pre-query, not per-row reads

Batched upserts cannot report per-row create/update. Options:

- **Alternative A — drop the distinction**, report only a single `processed` count. Simplest, but breaks the existing response contract and the admin's mental model.
- **Alternative B — one bulk `findMany({ where: { id: { in: allIds } }, select: { id: true } })`** before writing to get the set of already-existing ids. Then `updated = count(products whose id is in that set)`, `created = total − updated`. One extra query total (not per row), and it can itself be chunked by the same `BATCH_SIZE` for the `IN` list.
- **Decision**: Use **B**. It preserves the contract with O(rows / batchSize) extra reads instead of O(rows). Counts are computed against the pre-import state, which matches current semantics (a row present before this import = "updated").
- Edge case: an id appearing... cannot appear twice in `products` because `parseCsv` already dedupes in-file ids. So the count arithmetic is exact.

### Decision 4: Partial batch failure = fail the whole request, atomically per import

- A DB-level failure inside a batch (e.g. constraint violation, connection drop) is not a per-row validation issue — those were already filtered upstream. It signals an infrastructure or data-integrity problem.
- **Decision**: Wrap all batch writes in a single logical operation so that a batch failure **aborts the import and returns `500`** without a partially-applied, misreported result. Prefer wrapping the chunk writes in one `prisma.$transaction(async (tx) => { ... })` interactive transaction so either the whole import lands or none of it does. The activity log is written only on success.
- Alternative considered: continue past a failed batch and report it in `errors`. Rejected — it produces a partially-imported catalog with counts that no longer reflect reality, which is worse for a data pipeline than a clean all-or-nothing failure the admin can retry.
- Trade-off: a very large single transaction. Acceptable at the 10,000-row scale for a manual admin action; revisit only if row counts grow by another order of magnitude.

### Decision 5: Empty-input short-circuit

If `products.length === 0` (all rows invalid or empty file), skip all DB writes, still write the activity log, and return `{ created: 0, updated: 0, errors, errorDetails }`. Avoids issuing empty `IN ()` / empty `VALUES` statements.

## Risks / Trade-offs

- **[Raw SQL injection / parameterization mistakes]** → Use Prisma's parameterized `$executeRaw` tagged template or `Prisma.sql` join helpers; never string-concatenate row values into SQL. All values flow through bind parameters.
- **[Large single transaction holds locks longer]** → Acceptable for a manual, infrequent admin import at target scale; batch size keeps individual statements bounded. Documented as a revisit trigger if catalog grows 10×.
- **[Bind-parameter ceiling exceeded]** → `BATCH_SIZE = 500` with 6 columns stays far under Postgres's 65,535 limit; chunking enforces the ceiling structurally.
- **[created/updated slightly racy if another write lands mid-import]** → Same window exists today; last-write-wins on the `id` conflict is unchanged. Not a regression.
- **[Fallback (Decision 1B → 1A) changes SQL shape]** → Both paths satisfy the same spec scenarios; the spec is written against observable behavior (counts, atomicity, fault tolerance), not the SQL dialect, so either implementation passes.

## Migration Plan

No schema migration. This is a code change to one route (plus an optional helper).

- Deploy: standard code deploy; no DB migration step.
- Rollback: revert the route change. Because the response contract and DB effects (upsert on `id`) are unchanged, rollback is safe and requires no data cleanup.
- Verification: import a small CSV (mixed new/existing/invalid rows) and confirm counts + skipped rows; then a synthetic 10,000-row CSV to confirm latency and pool stability.

## Open Questions

- None blocking. Implementation may choose Decision 1B (raw `ON CONFLICT`) or the 1A fallback (chunked `$transaction` of upserts) based on ergonomics; both are pre-approved by this design.

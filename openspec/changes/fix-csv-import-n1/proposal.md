## Why

The admin CSV product import (`app/api/admin/products/import/route.ts`) runs two sequential database round-trips per CSV row — a `findUnique` followed by an `upsert` — inside a blocking `for` loop. The project must support 10,000+ products (a hard requirement in the project CLAUDE.md), so a full catalog import issues ~20,000 sequential queries. This can take minutes and exhaust the PostgreSQL connection pool, making imports unreliable at production scale.

## What Changes

- Replace the per-row `findUnique` + `upsert` loop in the import route with **batched database writes** (chunks of 500–1000 rows) so the number of round-trips scales with the batch count, not the row count.
- Preserve the existing behavior contract: valid rows are persisted, and invalid rows continue to be logged and skipped without aborting the whole import (validation already lives in `lib/csv-parser.ts` and is unchanged).
- Redefine how `created` vs `updated` counts are derived, since batched upserts no longer distinguish per-row create/update via a preceding read. The response shape (`{ success, created, updated, errors, errorDetails }`) is preserved.
- Define explicit behavior for **partial batch failures** (a batch that fails at the DB level must not silently drop rows or corrupt the summary counts).

**No** change to the CSV parser, validation rules, auth guard, or the activity-log write. Scope is limited to the DB-write section of the import route (and, if strictly required for batching, a narrowly scoped helper).

## Capabilities

### New Capabilities
- `admin-csv-import`: Bulk product import from CSV by an authenticated admin, covering the persistence behavior — batched upserts, row-level fault tolerance (invalid rows skipped, not fatal), partial-failure handling, and the import summary contract. This capability formalizes the import endpoint's persistence guarantees, which were previously implicit in the code.

### Modified Capabilities
<!-- None. No existing specs under openspec/specs/. -->

## Impact

- **Code**: `app/api/admin/products/import/route.ts` (DB-write loop, lines ~26–48). Possibly a small new helper (e.g. `lib/product-import.ts`) if batching logic warrants extraction — decided in design.
- **Data model**: None. `Product` schema unchanged; `id` (from `cod_prod`) remains the conflict key.
- **Dependencies**: None new. Uses existing Prisma 6 (`$transaction` and/or `$executeRaw` for `INSERT ... ON CONFLICT`).
- **APIs**: `POST /api/admin/products/import` response shape unchanged; import latency for large catalogs drops substantially.
- **Out of scope**: `lib/csv-parser.ts`, validation rules, streaming the CSV upload, and any admin-UI changes.

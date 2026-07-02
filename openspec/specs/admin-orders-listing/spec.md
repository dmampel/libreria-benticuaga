# admin-orders-listing

## ADDED Requirements

### Requirement: Paginated admin orders listing

The `GET /api/admin/orders` endpoint SHALL return orders in bounded pages instead of
returning every matching order. It SHALL accept `page` and `limit` query parameters and
return a pagination `meta` block alongside the data.

#### Scenario: Default page size is applied
- **WHEN** an authorized admin requests `GET /api/admin/orders` with no `page` or `limit`
- **THEN** the endpoint returns at most 50 orders
- **AND** the response is `{ success: true, data: [...], meta: { total, page: 1, limit: 50, totalPages } }`

#### Scenario: Explicit page and limit are honored
- **WHEN** an authorized admin requests `GET /api/admin/orders?page=2&limit=20`
- **THEN** the endpoint returns at most 20 orders starting after the first 20
- **AND** `meta.page` is 2 and `meta.limit` is 20

#### Scenario: Total and totalPages reflect the full filtered set
- **WHEN** an authorized admin requests a page of orders
- **THEN** `meta.total` equals the count of all orders matching the filters (ignoring pagination)
- **AND** `meta.totalPages` equals `ceil(total / limit)`

### Requirement: Pagination parameters are validated and clamped

The endpoint SHALL protect against unbounded or invalid pagination input.

#### Scenario: limit is clamped to a maximum
- **WHEN** an authorized admin requests `GET /api/admin/orders?limit=1000`
- **THEN** the effective limit is clamped to 100
- **AND** at most 100 orders are returned

#### Scenario: page and limit have safe minimums
- **WHEN** an authorized admin requests `page` or `limit` below 1 (e.g. `page=0`)
- **THEN** `page` is treated as at least 1 and `limit` as at least 1
- **AND** the request does not error

### Requirement: Status and date-range filtering is preserved

Existing filtering behavior SHALL continue to work under pagination.

#### Scenario: Filter by status
- **WHEN** an authorized admin requests `GET /api/admin/orders?status=PENDING`
- **THEN** only orders with status `PENDING` are counted and returned
- **AND** results remain ordered by `createdAt` descending

#### Scenario: Filter by date range
- **WHEN** an authorized admin requests `GET /api/admin/orders?from=2026-01-01&to=2026-01-31`
- **THEN** only orders created within that inclusive range are counted and returned

### Requirement: Order queries are index-backed

The `Order` model SHALL have database indexes supporting the admin listing filters so
that status and date-range queries do not require a full table scan.

#### Scenario: Indexes exist for admin filters
- **WHEN** the schema and migrations are applied
- **THEN** the `Order` table has indexes on `status`, on `createdAt`, and a composite
  index on `(status, createdAt)`
- **AND** the existing `userId` index is retained

### Requirement: Authorization is unchanged

The endpoint SHALL continue to require an authorized admin.

#### Scenario: Unauthorized request is rejected
- **WHEN** an unauthenticated or non-admin caller requests `GET /api/admin/orders`
- **THEN** the endpoint responds with HTTP 401 and `{ success: false, error }`

## ADDED Requirements

### Requirement: Batched persistence of imported products

The system SHALL persist parsed products to the database in batches, so that the number of database round-trips scales with the number of batches rather than the number of rows. The system SHALL NOT issue a separate per-row read followed by a per-row write for each imported product.

#### Scenario: Large catalog import uses batched writes
- **WHEN** an admin imports a CSV containing 10,000 valid product rows
- **THEN** the system persists all 10,000 products
- **AND** it does so using batched database operations (chunks bounded by a fixed batch size) rather than one read plus one write per row

#### Scenario: Batch size stays within database parameter limits
- **WHEN** any batch is written to the database
- **THEN** the batch contains no more than the configured maximum number of rows (a named constant, not a hardcoded literal)
- **AND** the number of bind parameters per statement stays within PostgreSQL limits

### Requirement: Upsert semantics on product id

The system SHALL insert products that do not exist and update products that already exist, keyed on the product `id` (derived from CSV `cod_prod`). Existing product data SHALL be overwritten with the imported values for `name`, `retailPrice`, `wholesalePrice`, `stock`, and `image`.

#### Scenario: New product is created
- **WHEN** the CSV contains a row whose `cod_prod` does not match any existing product
- **THEN** a new product is created with the imported fields

#### Scenario: Existing product is updated
- **WHEN** the CSV contains a row whose `cod_prod` matches an existing product
- **THEN** that product's `name`, `retailPrice`, `wholesalePrice`, `stock`, and `image` are updated to the imported values

### Requirement: Accurate created and updated counts

The import response SHALL report the number of products created and the number updated, determined against the database state prior to the import. These counts SHALL be derived without performing one read per row.

#### Scenario: Mixed create and update reported correctly
- **WHEN** an admin imports a CSV where 30 rows match existing products and 70 rows are new
- **THEN** the response reports `updated: 30` and `created: 70`

#### Scenario: Counts derived from a bulk pre-check, not per-row reads
- **WHEN** the system computes created versus updated counts
- **THEN** it determines which ids already exist using bulk lookups (chunked by the configured batch size), not one lookup per row

### Requirement: Row-level fault tolerance preserved

The import SHALL persist all valid rows and SHALL skip invalid rows without aborting. Invalid rows SHALL be logged and reported in the response, and SHALL NOT cause valid rows to be rejected. Row validation is performed during parsing and is unchanged by this capability.

#### Scenario: Invalid rows are skipped, valid rows persist
- **WHEN** an admin imports a CSV containing 95 valid rows and 5 invalid rows
- **THEN** the 95 valid products are persisted
- **AND** the response reports `errors: 5` with per-row `errorDetails` containing the row number and reason
- **AND** the import does not crash

#### Scenario: Empty or all-invalid input
- **WHEN** an admin imports a CSV where every row is invalid or the file is empty
- **THEN** the system performs no product writes
- **AND** returns `created: 0`, `updated: 0`, and the collected `errors`
- **AND** still writes the import activity-log entry

### Requirement: Atomic handling of batch failures

A database-level failure while writing a batch SHALL abort the entire import and return an error response, without leaving a partially-imported catalog whose reported counts do not reflect the actual database state. On such a failure the system SHALL respond with HTTP 500 and SHALL NOT report success.

#### Scenario: A failing batch aborts the whole import
- **WHEN** a batch write fails at the database level partway through an import
- **THEN** no products from the import remain partially applied with a success response
- **AND** the endpoint responds with HTTP 500 and `success: false`

#### Scenario: Successful import records an activity log
- **WHEN** an import completes without a database-level failure
- **THEN** the system writes an activity-log entry recording the file name and the created, updated, and error counts
- **AND** responds with `success: true` and the `{ created, updated, errors, errorDetails }` summary

### Requirement: Response contract preserved

The endpoint `POST /api/admin/products/import` SHALL continue to require an authenticated admin and SHALL return the same response shape as before this change: `{ success, created, updated, errors, errorDetails }` on success.

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request to the import endpoint is not from an authorized admin
- **THEN** the system responds with HTTP 401 and does not persist any products

#### Scenario: Response shape is unchanged
- **WHEN** an authenticated admin completes a successful import
- **THEN** the response body contains `success`, `created`, `updated`, `errors`, and `errorDetails` fields

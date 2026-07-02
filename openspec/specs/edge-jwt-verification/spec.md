# edge-jwt-verification

## ADDED Requirements

### Requirement: Cryptographic signature verification before granting access

The Edge middleware SHALL cryptographically verify the signature of the `auth_token` JWT cookie against the server-held secret before granting access to any route matched by `["/account/:path*", "/admin/:path*"]`. The middleware SHALL NOT rely on decoding the payload alone (e.g. base64 + `JSON.parse`) as proof of authenticity.

#### Scenario: Valid, correctly-signed token grants access
- **GIVEN** a user has a valid `auth_token` cookie signed by the server with a non-expired `exp`
- **WHEN** the user requests a protected route (`/account/*` or a non-admin-restricted portion of `/admin/*` for which their claims qualify)
- **THEN** the middleware verifies the signature successfully
- **AND** access is granted (request proceeds)

#### Scenario: Forged or tampered token is rejected
- **GIVEN** an attacker crafts a cookie payload (e.g. `{ id, email, isAdmin: true, exp: <future> }`) not signed by the server, or modifies any byte of a legitimately-issued token's header/payload
- **WHEN** the attacker requests a protected route with that cookie
- **THEN** signature verification fails
- **AND** access is denied and the request is redirected to `/auth/login?from=<pathname>`

### Requirement: Expiry is enforced on the verified token

The middleware SHALL treat a token whose `exp` claim has passed as invalid, even if its signature verifies correctly.

#### Scenario: Expired token is rejected
- **GIVEN** a token with a valid signature but an `exp` claim in the past
- **WHEN** the token's bearer requests a protected route
- **THEN** the middleware rejects the token
- **AND** the request is redirected to `/auth/login?from=<pathname>`

### Requirement: Missing or malformed tokens deny access

The middleware SHALL deny access when no token is present or when the token cannot be parsed/verified as a well-formed JWT.

#### Scenario: No token present
- **GIVEN** a request to a protected route has no `auth_token` cookie
- **WHEN** the middleware evaluates the request
- **THEN** access is denied
- **AND** the request is redirected to `/auth/login?from=<pathname>`

#### Scenario: Malformed token value
- **GIVEN** the `auth_token` cookie contains a value that is not a well-formed, verifiable JWT (e.g. wrong number of segments, invalid encoding)
- **WHEN** the middleware evaluates the request
- **THEN** verification fails
- **AND** the request is redirected to `/auth/login?from=<pathname>`

### Requirement: Admin authorization check applies only to verified tokens

For routes matched by `/admin/:path*`, the middleware SHALL require a verified token whose claims include `isAdmin: true`. A non-admin claim on an otherwise validly-signed, non-expired token SHALL NOT grant admin access, and SHALL be redirected per existing non-admin behavior rather than treated as an authentication failure.

#### Scenario: Non-admin verified token on an admin route
- **GIVEN** a token with a valid signature, non-expired `exp`, and `isAdmin` absent or `false`
- **WHEN** its bearer requests a route matched by `/admin/:path*`
- **THEN** access to the admin route is denied
- **AND** the request is redirected to `/products` (not to `/auth/login`)

### Requirement: Verification fails closed on configuration or runtime errors

If the server-held secret is unavailable/unset, or the verification step throws for any reason (including unsupported/unexpected signing algorithm), the middleware SHALL treat the request as unauthenticated. It SHALL NOT grant access and SHALL NOT crash or allow the request to proceed unchecked.

#### Scenario: Verification secret is unset
- **GIVEN** the server-side secret used to verify tokens is not configured in the runtime environment
- **WHEN** any request to a protected route is evaluated
- **THEN** the middleware denies access to every request rather than granting access
- **AND** the request is redirected to `/auth/login?from=<pathname>`

#### Scenario: Verification throws unexpectedly
- **GIVEN** the verification step raises an error for any reason (corrupt token, unexpected algorithm, internal failure)
- **WHEN** the middleware handles that error
- **THEN** the request is denied and redirected to `/auth/login?from=<pathname>`
- **AND** the middleware does not crash or fall through to granting access

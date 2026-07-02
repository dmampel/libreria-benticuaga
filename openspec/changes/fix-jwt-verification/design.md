# Design: fix-jwt-verification

## Governance

**CRITICAL domain (Auth/Security).** This is a planning document only — no implementation code is written during this phase. The `apply` phase **requires explicit user approval before any real code is written, any file is modified, or the `jose` dependency is installed.**

## Context

- **App**: Benticuaga, a stationery ecommerce built on Next.js 16 (App Router) + TypeScript + Prisma 6 + PostgreSQL.
- **Auth model (unchanged by this change)**: On login/register, `lib/auth.ts::generateToken` signs a JWT with `jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" })` (jsonwebtoken → HS256 by default). Payload shape (`TokenPayload`): `{ id, email, role, isAdmin?, firstName?, lastName? }`. The token is stored in the `auth_token` cookie.
- **Current middleware** (`proxy.ts`, project root, matcher `["/account/:path*", "/admin/:path*"]`): exports a sync `proxy(request)` that reads the `auth_token` cookie and calls a local `decodeToken` helper. That helper splits the JWT, base64-decodes the **payload segment only**, and `JSON.parse`s it — it **never verifies the signature**. `isTokenValid` only checks presence of `id`/`email` and a future `exp`. For `/admin`, it then checks `decoded.isAdmin`.
- **Vulnerability**: Because the signature is never checked, an attacker can forge any payload (including `isAdmin: true` and a future `exp`) and pass all checks. This is an auth bypass / admin privilege escalation.
- **Design constraint the original author got right**: no DB query in the Edge Runtime (middleware must stay light). The mistake was verifying *nothing*, not even the signature that can be checked locally without any I/O.
- **Runtime constraint**: middleware runs in the Edge Runtime. `jsonwebtoken` depends on Node crypto/Buffer APIs and does **not** run in Edge. This is why `lib/auth.ts`'s `verifyToken` cannot simply be imported into `proxy.ts`.

## Goals / Non-Goals

**Goals:**
- Reject any `auth_token` whose HMAC signature does not verify against `JWT_SECRET`.
- Reject tampered payloads (any change to header/payload invalidates the signature).
- Reject expired tokens and missing/malformed tokens.
- For `/admin`, continue to require a verified `isAdmin: true` claim; non-admins are redirected as before.
- Keep the middleware light and fast: local verification only, **no DB round-trip**, no new network calls.
- Preserve the existing shape of `proxy.ts`: the admin-route block and account-route block, the redirect targets, and the `config.matcher`.

**Non-Goals:**
- Redesigning the auth system, session model, or token contents.
- Changing login/register/token-signing code in `lib/auth.ts`.
- Adding DB lookups, revocation lists, or refresh-token logic to the middleware.
- Changing which routes are protected (the matcher stays the same).
- Rotating or changing the signing algorithm/secret.

## Decisions

### D1. Verify the signature locally in the middleware using `jose.jwtVerify`
**Choice**: Add the `jose` library and call `await jwtVerify(token, secret, { algorithms: ["HS256"] })`, where `secret = new TextEncoder().encode(process.env.JWT_SECRET)`. On success, use the verified `payload`; on any throw, treat the token as invalid.

**Rationale**: `jose` is Edge-Runtime compatible (Web Crypto based), unlike `jsonwebtoken`. It performs signature verification and `exp` validation in one call, closing the forgery hole while keeping the middleware I/O-free. The signing side already produces HS256 tokens, so verification is symmetric with the same `JWT_SECRET`.

**Alternatives considered**:
- *Import `verifyToken` from `lib/auth.ts`* — rejected: `jsonwebtoken` cannot run in the Edge Runtime.
- *Query the DB per request to validate the user/session* — rejected: violates the "keep middleware light" constraint and adds latency; not needed to close this specific hole.
- *Move protected routes off the Edge Runtime to Node* — rejected: larger blast radius, changes deployment characteristics, out of scope.

### D2. Pin the algorithm to `HS256`
**Choice**: Pass `{ algorithms: ["HS256"] }` explicitly to `jwtVerify`.

**Rationale**: The app signs with the default HS256. Pinning the accepted algorithm prevents algorithm-confusion attacks (e.g. `alg: none` or forcing an unexpected algorithm). Never trust the `alg` header supplied by the client.

### D3. `proxy` becomes `async`
**Choice**: `jwtVerify` is async, so the exported `proxy` function becomes `async (request) => ...` and each verification is `await`ed. Both the `/admin` block and the `/account` block await verification before granting access.

**Rationale**: Required by `jose`. Next.js middleware supports async functions. No external caller depends on the sync signature.

### D4. Fail closed
**Choice**: Any failure — no token, malformed token, signature mismatch, expired, missing required claims — results in redirect to `/auth/login?from=<pathname>` (same behavior the current code uses on invalid token). A verified token lacking `isAdmin` hitting `/admin` is redirected to `/products` (unchanged). Verification failure never falls through to `NextResponse.next()`.

**Rationale**: Default-deny is the correct posture for an auth gate.

### D5. Read the secret from `JWT_SECRET` env var
**Choice**: Use `process.env.JWT_SECRET` (same variable used for signing). If it is unset, treat verification as failing (fail closed) rather than granting access.

**Rationale**: No hardcoded secrets (project standard). Symmetric with signing. A misconfigured environment must not silently allow access.

### D6. Keep claim/type shape explicit, no `any`
**Choice**: Keep a typed representation of the verified payload (e.g. `id`, `email`, `isAdmin`, `exp`) derived from `jose`'s `JWTPayload`, using narrowing/type guards instead of `any`, consistent with `lib/auth.ts::TokenPayload`.

**Rationale**: Project standard: full TypeScript, no `any`.

## Risks / Trade-offs

- **`JWT_SECRET` unset or mismatched between signing and verifying** → all tokens rejected, users locked out. *Mitigation*: same env var is already used by `lib/auth.ts`; verify `.env` parity in the migration steps; fail closed (redirect to login) rather than allow.
- **Algorithm mismatch** (if signing side ever changes from HS256) → verification fails. *Mitigation*: D2 pins HS256, matching current signing; document that changing the signing algorithm requires updating the middleware.
- **`jose` bundle in Edge Runtime** → slight increase in middleware bundle size. *Mitigation*: `jose` is small and Edge-optimized; verification is local HMAC, latency is negligible.
- **Behavioral regression** (a previously "working" forged/loose token now rejected) → intended: legitimate tokens signed by `lib/auth.ts` continue to verify; only forged/tampered/expired ones are now rejected.
- **No token revocation** → a valid unexpired token remains accepted until `exp`. *Accepted*: out of scope; unchanged from today; revocation would require the DB round-trip this change deliberately avoids.

## Migration Plan

1. (apply, after approval) Add `jose` to `package.json` and install.
2. Replace `decodeToken`/`isTokenValid` in `proxy.ts` with `jose.jwtVerify`-based verification; make `proxy` async; keep admin/account block structure and redirects intact.
3. Confirm `.env`/`.env.local` and deployment env define `JWT_SECRET` (already required for signing).
4. Verify locally: valid login token → access granted; forged/tampered/expired/missing token → redirected to login; non-admin verified token on `/admin` → redirected to `/products`.
5. **Rollback**: revert `proxy.ts` and remove `jose` from `package.json`. Since this only tightens verification, rollback reintroduces the vulnerability but does not break legitimate flows.

## Open Questions

- Is the signing algorithm guaranteed to remain HS256, or is a future move to RS256/asymmetric keys anticipated? (Affects whether to pin one algorithm or support a set.) — Assume HS256 for now per current signing.
- Should middleware behavior differ for API routes vs. page routes if the matcher is later widened? — Out of scope; matcher is unchanged.

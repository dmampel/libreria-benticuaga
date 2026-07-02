# Proposal: fix-jwt-verification

## Why

The Next.js middleware (`proxy.ts`) decodes the JWT payload from the `auth_token` cookie **without verifying its cryptographic signature**. It base64-decodes and `JSON.parse`s the payload, then only checks that `id`/`email` exist and that `exp` is in the future. As a result, any unauthenticated attacker can hand-craft a cookie with an arbitrary payload — e.g. `{ id, email, isAdmin: true, exp: <future> }` — and the middleware will accept it, granting access to `/admin` and `/account`. This is an **authentication/authorization bypass with admin privilege escalation** and must be closed before launch.

## What Changes

- Replace the unsafe `decodeToken` helper in `proxy.ts` with **signature-verifying** logic using the Edge-compatible `jose` library (`jwtVerify`), keyed on the same `JWT_SECRET` the app already uses to sign tokens in `lib/auth.ts`.
- The middleware will **reject** any token whose signature is invalid, whose payload has been tampered with, that has expired, or that is missing/malformed — before granting access to any protected route.
- Because `jose.jwtVerify` is asynchronous, the exported `proxy` function becomes `async` and its internal verification calls are `await`ed. **BREAKING (internal):** `proxy`'s signature changes from sync to `async` — no external callers, but noted for completeness.
- Add the `jose` dependency to `package.json` (it is Edge-Runtime compatible; `jsonwebtoken` is not and cannot run in middleware).
- **No DB round-trip is added.** Verification stays local and light, preserving the original intent of keeping the middleware fast in the Edge Runtime.

Out of scope (deliberately unchanged): the login/register/token-signing code, the auth model as a whole, the route matcher behavior, and any addition of DB queries to the middleware.

## Capabilities

### New Capabilities
- `edge-jwt-verification`: Behavior contract for how the Edge middleware authenticates protected routes (`/admin`, `/account`) by cryptographically verifying the `auth_token` JWT signature, expiry, and required claims before granting access, and how it handles forged, tampered, expired, missing, or non-admin tokens.

### Modified Capabilities
<!-- None. There is no existing openspec/specs/ capability whose documented requirements change; this introduces the first spec for middleware auth behavior. -->
- (none)

## Impact

- **Code**: `proxy.ts` (project root) — the `decodeToken`/`isTokenValid` helpers and the `proxy` function.
- **Dependencies**: adds `jose` to `package.json`. `JWT_SECRET` env var is already required and used by `lib/auth.ts`; no new env var.
- **Runtime**: middleware becomes `async`; no new network/DB calls. Latency impact is negligible (local HMAC verification).
- **Security**: closes an admin privilege-escalation / auth-bypass vulnerability.

## Governance

**CRITICAL domain (Auth/Security).** This planning phase (proposal → design → specs → tasks) is analysis and planning ONLY; no implementation code is written now. The subsequent `apply` phase **requires explicit user approval before any real code is written or dependencies are installed.**

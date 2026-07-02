# Tasks: Fix JWT Signature Verification in Edge Middleware

## Governance Gate

**CRITICAL domain (Auth/Security).** No task below except 0.1 may be executed without explicit user approval, regardless of the Review Workload Forecast result.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~90-130 (single file rewrite: `proxy.ts` ~75 lines touched, `package.json` +1 line, lockfile excluded) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

> `Decision needed before apply: Yes` is forced here by the CRITICAL governance gate (auth bypass fix), independent of the Low size risk.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Add `jose`, replace verification logic in `proxy.ts`, verify against all 9 spec scenarios | PR 1 | Single-file scope; no external callers depend on `proxy`'s sync signature |

## Phase 0: Approval Gate

- [x] 0.1 STOP — obtain explicit user approval before running `npm install jose` or editing `proxy.ts`. This is the only task safe to complete during planning. (User explicitly approved apply for this CRITICAL/auth change.)

## Phase 1: Foundation

- [x] 1.1 (post-approval) Add `jose` to `package.json` dependencies and run install (proposal: Edge-Runtime-compatible replacement for `jsonwebtoken`). Installed `jose@^6.2.3` via `npm install jose`.
- [x] 1.2 Confirm `JWT_SECRET` is set in `.env.local`, `.env.example`, and deployment env — no new env var is introduced (Design D5). Confirmed present in `.env.local` (value set) and `.env.example` (template placeholder, as expected). Deployment env could not be verified from this sandboxed session — flag for user to confirm in production/hosting config before deploy.

## Phase 2: Core Verification Logic (`proxy.ts`)

- [x] 2.1 Remove `decodeToken`/`isTokenValid`; add a typed `verifyAuthToken(token)` async helper using `jwtVerify(token, secret, { algorithms: ["HS256"] })`, `secret = new TextEncoder().encode(process.env.JWT_SECRET)` (Design D1, D2).
- [x] 2.2 Inside `verifyAuthToken`, short-circuit and fail closed if `process.env.JWT_SECRET` is unset, before calling `jwtVerify` (Design D5; spec: "Verification secret is unset").
- [x] 2.3 Wrap `jwtVerify` in try/catch; any throw (bad signature, expired, malformed, unexpected alg) returns invalid — never fall through to `NextResponse.next()` (Design D4; spec: "Verification throws unexpectedly", "Forged or tampered token is rejected", "Expired token is rejected", "Malformed token value").
- [x] 2.4 Derive a typed payload (`id`, `email`, `isAdmin`, `exp`) from `jose`'s `JWTPayload` via a type guard — no `any` (Design D6).

## Phase 3: Wire into `proxy()`

- [x] 3.1 Change `export function proxy(request: NextRequest)` to `export async function proxy(request: NextRequest)` (Design D3).
- [x] 3.2 In the `/admin` block, replace old decode/validate calls with `await verifyAuthToken(token)`; keep no-token redirect to `/auth/login?from=<pathname>`, keep invalid-token redirect to the same, keep `isAdmin`-false redirect to `/products` unchanged (spec: "Non-admin verified token on an admin route").
- [x] 3.3 In the `/account` block, replace old decode/validate calls with `await verifyAuthToken(token)`; keep no-token and invalid-token redirects to `/auth/login?from=<pathname>` (spec: "Valid, correctly-signed token grants access", "No token present").
- [x] 3.4 Confirm `export const config = { matcher: [...] }` is unchanged.

## Phase 4: Manual Verification (no test runner in this project — code-review + manual check)

- [x] 4.1 Trace: valid signed token → `verifyAuthToken` returns payload → `NextResponse.next()`.
- [x] 4.2 Trace: forged/tampered payload → signature mismatch → caught → redirect `/auth/login`.
- [x] 4.3 Confirm `jwtVerify` enforces `exp` natively; no custom expiry check remains.
- [x] 4.4 Confirm no-token branches still short-circuit before calling `verifyAuthToken`.
- [x] 4.5 Confirm malformed/wrong-segment-count tokens throw and are caught.
- [x] 4.6 Confirm non-admin verified token on `/admin` redirects to `/products`, not `/auth/login`.
- [x] 4.7 Inspect: unset `JWT_SECRET` path denies every request, never reaches `NextResponse.next()`.
- [x] 4.8 Confirm unexpected-throw path never crashes or falls through to access-granted.
- [x] 4.9 Live manual check against running dev server (localhost:3000): forged cookie (`isAdmin: true`, signed with wrong secret) hitting `/admin` → 307 redirect to `/auth/login?from=%2Fadmin` (PASS, bypass closed). No cookie hitting `/admin` → same redirect (PASS). Malformed cookie hitting `/account` → redirect to `/auth/login?from=%2Faccount` (PASS). Real-user login session not exercised in this pass (would need live credentials) — forged/missing/malformed paths, which are the security-critical ones, are verified.

## Phase 5: Cleanup

- [x] 5.1 Remove the now-dead `DecodedToken` interface and any unused imports/helpers.
- [x] 5.2 Re-read final `proxy.ts` against `CLAUDE.md` (explicit types, no `any`, no hardcoded secrets) and against Design D1-D6. Verified via `npx tsc --noEmit` (clean) and `npx eslint proxy.ts` (clean).

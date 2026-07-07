# Next.js checks

Next.js concentrates risk where the trust boundary is invisible: code that looks like a client component may run on the server, and "middleware auth" feels like a wall but is a curtain. Check the version first — several 2025 CVEs are exploitable regardless of your code.

## Version / CVE triage (do this first)
Read the `next` version from `package.json`/lockfile and flag if vulnerable:
- **CVE-2025-29927 (CVSS 9.1) — middleware authorization bypass.** A crafted `x-middleware-subrequest` header skips middleware entirely. Any app relying on middleware for auth on affected versions is bypassable unauthenticated. Fix: upgrade; and never rely on middleware as the sole auth gate.
- **RSC / React Server Components RCE and SSRF CVEs (2025)** — flag self-hosted deployments on unpatched versions.
Recommend upgrading to the current patched release and running `npm audit`.

## The middleware trap (A01)
Grep: `middleware.ts`, `middleware.js`.
- Middleware runs at the edge for routing/response-shaping — **it is not a security boundary.** Auth checks that live *only* in middleware are the #1 Next.js finding. The real check must live in the **Route Handler, Server Action, or a Data Access Layer** that every data read/write goes through.
- Report as HIGH: protected data whose only gate is a `middleware.ts` redirect.

## Server Actions (A01/A05)
Grep: `"use server"`, `use server`.
- A Server Action is a **public POST endpoint**, callable directly with any arguments regardless of which UI "should" reach it. Every action must (1) authenticate, (2) authorize the specific object, (3) validate/parse its arguments (e.g. Zod) — never trust the typed signature.
- SSRF: an action that fetches a user-supplied URL. Allowlist hosts.
- Mass assignment: passing `formData`/args straight into a DB update.

## Route Handlers & API routes (A01/A05)
Grep: `route.ts`, `route.js`, `pages/api`.
- Same rules: authenticate + authorize + validate every handler. Check `params.id` isn't read/written without an ownership check (IDOR).
- Old `pages/api` bodyparser limits, and any handler doing `fetch(req.query.url)` (SSRF).

## The client/server data-leak trap (A04)
- **`NEXT_PUBLIC_` env vars are inlined into the browser bundle.** Any secret with that prefix is public. Grep `NEXT_PUBLIC_` and flag anything that looks like a key/secret/token/DB URL.
- Server Components can accidentally pass secrets to Client Components via props — props cross the network boundary and are serialized to the client. Trace what a `'use client'` component receives.
- Import server-only secrets modules with the `server-only` package guard so they can't be pulled client-side.

## Rendering / XSS (A05)
Grep: `dangerouslySetInnerHTML`.
- React auto-escapes JSX, so `dangerouslySetInnerHTML` is the main stored/reflected XSS sink. Confirm the HTML isn't user-authored, or is sanitized (DOMPurify) first.
- `href={userValue}` allowing `javascript:` URLs; `next/image` / `next.config` `remotePatterns` set to `**` (open image proxy → SSRF-ish).

## Config & headers (A02)
- `next.config.js`: check `headers()` sets CSP + security headers; check `images.remotePatterns`/`domains` aren't wildcarded; ensure `productionBrowserSourceMaps` isn't leaking source in prod.
- Rate limiting on auth routes (e.g. `@upstash/ratelimit`) — its absence is A06.

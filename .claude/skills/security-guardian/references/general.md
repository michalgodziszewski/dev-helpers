# Cross-cutting checks (all stacks)

These apply to every web app regardless of framework, organized by the OWASP Top 10:2025 categories. Read the framework-specific file for how each manifests in Next.js / NestJS / Angular. For each check, trace untrusted input to the sink before reporting.

Grep starting points (read the surrounding code before judging):
```
process.env            secrets referenced — check none are hardcoded or shipped to client
eval(|new Function(    dynamic code execution
child_process|exec(    command injection surface
JSON.parse(            prototype-pollution / DoS on untrusted input
Math.random(           weak randomness for tokens/ids
http:\/\/               plaintext transport, mixed content
```

## A01 — Broken Access Control (incl. SSRF)
The #1 risk. Look for:
- **Missing authorization on the actual operation.** An endpoint that authenticates ("who are you") but never authorizes ("are you allowed to touch *this* record"). Any handler that takes an `id`/`userId`/`orgId` from the request and reads/writes it without checking ownership is **IDOR / broken object-level authorization**.
- **Authorization only at the edge.** Auth enforced solely in middleware, a route guard, or the client, while the data layer trusts its inputs. Edge checks are bypassable; the DB query must be scoped to the caller.
- **Mass assignment.** Binding a whole request body to a model/entity (`{ ...req.body }`, `Object.assign(user, req.body)`) lets an attacker set fields like `role`, `isAdmin`, `verified`.
- **SSRF** (now folded into A01): any server-side fetch/axios/http request whose URL, host, or port derives from user input. Impact is highest when it can reach `169.254.169.254` (cloud metadata → IAM creds), `localhost`, or internal hostnames. Require an allowlist of hosts; block internal/link-local ranges and redirects.
- **Path traversal:** file reads/writes with a user-supplied path segment (`../`), unbounded `sendFile`/`res.download`.

## A02 — Security Misconfiguration
- **CORS** reflecting `Origin` back with `Access-Control-Allow-Credentials: true`, or `origin: '*'` on authenticated APIs. 85% of cross-origin attacks trace to this. Require an explicit allowlist.
- **Missing security headers**: CSP, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `X-Frame-Options`/frame-ancestors. Use `helmet` on Node backends.
- Debug/verbose modes, stack traces, source maps, or `/debug` endpoints reachable in production.
- Default credentials, admin panels, or Swagger/GraphQL introspection exposed unauthenticated in prod.

## A03 — Software Supply Chain Failures
- **Known-vulnerable dependencies.** Check framework/library versions against known CVEs (Next.js middleware/RSC/SSRF CVEs, etc.). Recommend `npm audit` and note any obviously outdated critical package. This is now a top-3 risk — a vulnerable version is a finding even with perfect code.
- Unpinned or `*` version ranges on security-sensitive packages; postinstall scripts from untrusted deps; lockfile absent.

## A04 — Cryptographic Failures
- **Secrets in code or client bundles**: API keys, DB URLs, private keys, JWT secrets hardcoded or exposed to the browser (see framework files for the public-env-var trap).
- Passwords hashed with fast/broken algorithms (MD5, SHA1, plain SHA-256) instead of bcrypt/argon2/scrypt.
- Sensitive tokens generated with `Math.random()` instead of `crypto.randomBytes`/`randomUUID`.
- Sensitive data over HTTP, missing HSTS, secrets/PII written to logs.
- Cookies for auth/session missing `HttpOnly`, `Secure`, and `SameSite`.

## A05 — Injection
- **SQL/NoSQL**: string-concatenated queries, unparameterized `db.query(\`... ${input}\`)`, Mongo queries built from raw `req.body` (operator injection like `{ $ne: null }`), ORM `.raw()` with interpolation.
- **Command injection**: `exec`/`execSync` with interpolated input — use `execFile` with an args array.
- **XSS** (reflected/stored/DOM): untrusted data reaching HTML without escaping (see framework files — `dangerouslySetInnerHTML`, `bypassSecurityTrust*`, `innerHTML`).
- **SSTI / template injection**, **LDAP**, **header/CRLF injection** into redirects or response headers.

## A06 — Insecure Design
- No **rate limiting / brute-force protection** on login, password-reset, OTP, or token endpoints.
- Guessable password-reset tokens, no account lockout, missing step-up auth on sensitive actions.
- Trusting client-supplied prices/quantities/roles in business logic.

## A07 — Authentication Failures
- **JWT flaws**: `alg: none` accepted, signature not verified, secret weak/shared, no expiry, algorithm confusion (RS256↔HS256), sensitive data in an unencrypted token.
- Sessions that don't rotate on login, never expire, or aren't invalidated on logout.
- Credentials in URLs/query strings; missing MFA on high-value accounts.

## A08 — Software or Data Integrity Failures
- Deserializing untrusted data; loading scripts from a CDN without SRI; CI/CD or webhook handlers that don't verify signatures (Stripe/GitHub webhooks).
- Auto-update or dynamic `import()` of user-influenced paths.

## A09 — Security Logging & Alerting Failures
- No audit trail on auth events, access-control failures, or high-value actions.
- **Over-logging**: passwords, tokens, full card/PII written to logs (also A04).

## A10 — Mishandling of Exceptional Conditions (new in 2025)
- **Failing open**: an auth/permission check inside a `try` whose `catch` proceeds as if allowed. On error, deny.
- Unhandled rejections that crash the process (DoS) or leak stack traces to the client.
- Error responses that disclose internals (SQL errors, file paths, framework versions).
- Race conditions / TOCTOU in checks around payments, balances, or one-time tokens.

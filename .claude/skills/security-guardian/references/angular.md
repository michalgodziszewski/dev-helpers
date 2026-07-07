# Angular checks

Angular is XSS-safe by default: it treats all interpolated values as untrusted and auto-sanitizes. That means real client-side findings cluster around the few explicit escape hatches. But remember the client is never the trust boundary — the most important Angular findings are often about what the code *reveals* about missing server-side controls.

## The XSS escape hatches (A05) — the core client-side risk
The only ways to defeat Angular's built-in sanitization are these; grep for each and confirm no untrusted data flows in:
- **`bypassSecurityTrust*`** — `bypassSecurityTrustHtml/Script/Url/ResourceUrl/Style`. Each is a deliberate "I vouch this is safe." If the argument is or contains user input, it's XSS (HIGH if stored). This is the #1 Angular finding.
- **`[innerHTML]="..."`** bound to user-controlled data. Angular sanitizes HTML here, but sanitization strips scripts, *not* all vectors — and any `bypassSecurityTrustHtml` value passes through raw. Prefer text binding; sanitize with a vetted lib if HTML is required.
- **Direct DOM access**: `ElementRef.nativeElement.innerHTML`, `Renderer2.setProperty(el, 'innerHTML', ...)`, `document.write`, `insertAdjacentHTML` — these bypass Angular entirely. Any user data here is unsanitized XSS.
- **`eval()` / `new Function()`** with request or user data.

## URL / navigation sinks (A05/A01)
- `[href]`/`[src]` bound to user values allowing `javascript:` schemes (Angular sanitizes URLs, but `bypassSecurityTrustUrl` disables that).
- `Router.navigateByUrl(userInput)` / open redirects from a `returnUrl` query param without an allowlist.
- `window.location = userInput`.

## Content Security Policy (A02)
- Check for a CSP header (set by the server/host, not Angular). Recommend CSP Level 3 with **nonces/hashes**, not host allowlists (host allowlists are repeatedly bypassable). Minimal Angular policy: `default-src 'self'; script-src 'self' 'nonce-...'; style-src 'self' 'nonce-...'`.
- Recommend **Trusted Types** (`require-trusted-types-for 'script'`) — Angular supports it and it neutralizes most DOM-XSS sinks at the platform level.

## What the client reveals about the server (most important)
Angular is a client bundle — treat everything in it as public and read it for what it implies about the backend:
- **Secrets in the bundle / `environment.ts`**: API keys, tokens, secrets shipped to the browser are exposed to every user (A04). Only publishable/public keys belong here.
- **Auth guards are UX, not security.** `CanActivate`/route guards and `*ngIf="isAdmin"` only hide UI. Every request the hidden UI would make must be independently authorized server-side. If the app assumes the guard protects data, the backend is the real finding — flag it and check the API.
- **Client-side validation is not a control.** Reactive-form validators improve UX; the server must revalidate. Note any logic (pricing, role, quantity) that appears trusted only because the form enforces it.
- Sensitive data over-fetched to the client (full user objects incl. password hashes, other users' PII) — a backend authorization/serialization problem visible from the frontend.

## Other
- `HttpClient` requests: XSRF token handling for cookie-based auth (`HttpClientXsrfModule`) if the backend uses session cookies.
- Avoid disabling Angular's sanitization globally; avoid `[innerHTML]` with markdown/rich-text unless sanitized server- or client-side with DOMPurify.

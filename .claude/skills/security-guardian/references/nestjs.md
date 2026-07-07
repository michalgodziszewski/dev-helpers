# NestJS checks

NestJS gives you the tools for a clean trust boundary (guards, pipes, DTOs) — findings usually come from those tools being absent, applied inconsistently, or bypassed. Trace each controller route from request to database.

## Input validation (A05) — the foundation
Grep: `ValidationPipe`, `class-validator`, `@Body(`, `whitelist`.
- Confirm a **global `ValidationPipe`** is registered (`app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`).
- Without `whitelist: true`, unexpected properties pass through → **mass assignment** (attacker sets `role`, `isAdmin`). This is the highest-frequency NestJS finding.
- Every `@Body()`/`@Query()`/`@Param()` should bind to a **DTO with class-validator decorators**. A `@Body() body: any` or a plain interface (interfaces vanish at runtime, so no validation runs) is a hole.
- Nested objects need `@ValidateNested()` + `@Type()` or they're unchecked.

## Authorization (A01)
Grep: `@UseGuards`, `AuthGuard`, `canActivate`, `@Roles`.
- **Authentication ≠ authorization.** An `AuthGuard('jwt')` proves identity; it does not check the user may touch *this* resource. Find routes taking an `:id` that query/update by that id without confirming ownership or role → **IDOR (HIGH)**.
- Guards applied unevenly: a `@UseGuards` on the controller but a sensitive method excluded, or a global guard with `@Public()` overrides on routes that shouldn't be public.
- RBAC/ABAC checks done in the controller body but skippable, or role read from a client-supplied field instead of the verified token.

## JWT & auth (A07/A04)
Grep: `JwtModule`, `JwtService`, `secret`, `passport`.
- Secret hardcoded or weak instead of `ConfigService`/env; no `expiresIn`; algorithm not pinned (accepting `none` or allowing RS256/HS256 confusion).
- Passwords hashed with bcrypt/argon2 — flag MD5/SHA1/plaintext.
- Refresh tokens not rotated or not revocable.

## Injection (A05)
- **TypeORM/Prisma/Sequelize raw queries**: `query(\`... ${x}\`)`, `.query()`, `$queryRawUnsafe`, `.createQueryBuilder().where('x = ' + input)` → SQL injection. Require parameter binding (`:param`, `$1`, tagged `$queryRaw`).
- **Mongo/Mongoose**: filters built from raw `req.body`/`req.query` allow operator injection (`{ $ne: null }`, `{ $gt: '' }`) → auth bypass. Cast/validate types first.
- `@nestjs/microservices` or `child_process` command execution with interpolated input.

## Configuration & exposure (A02)
- **CORS**: `app.enableCors()` with no args allows all origins; `origin: true` reflects any origin. With credentials this is exploitable — require an explicit allowlist.
- **Helmet** registered for security headers.
- **Rate limiting**: `@nestjs/throttler` present and applied to auth endpoints (absence = A06 brute-force).
- **Swagger** (`SwaggerModule`) exposed in production without auth → endpoint/enumeration disclosure.
- Global exception filter that doesn't leak stack traces / internal messages to clients (A10).
- `ConfigModule` validating required env vars; secrets never returned in responses (check entity serialization — password/hash fields excluded via `@Exclude()` or a response DTO).

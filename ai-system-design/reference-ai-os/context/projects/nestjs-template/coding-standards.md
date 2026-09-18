# nestjs-template coding standards

Part of [`project-overview.md`](project-overview.md)'s reference set for this project.

<!-- Template: NestJS. Select this template explicitly during context initialization. -->

## Core Rules

* Use strict TypeScript.
* Do not use `any`; use proper types, DTOs, or `unknown`.
* One responsibility per module — group by feature (`users/`, `orders/`, ...), not by technical
  layer.
* Controllers stay thin: parse/validate input, call a service, return the result. No business
  logic in controllers.
* Business logic lives in providers (services); providers are injectable and depend on
  interfaces/abstractions where a boundary is worth decoupling (e.g. external APIs, persistence).
* Use constructor injection (Nest's standard DI pattern) — do not reach for `inject()`-style
  patterns from other frameworks.
* Use `async`/`await` throughout; never leave a floating promise (no un-awaited async call
  without `.catch`/`void`).
* Use Nest's built-in `Logger`, never `console.log`/`console.debug` in application code.

## Modules, Controllers, Providers

* One feature module per domain concept, exporting only what other modules need.
* Register providers via the module's `providers` array; avoid manual instantiation.
* Keep controllers free of direct database/ORM/HTTP-client calls — always through a service.
* Use route decorators (`@Get`, `@Post`, ...) with explicit path segments; avoid magic strings
  duplicated across files — centralize route constants where reused.

## DTOs & Validation

* Define a DTO class for every request body/query/param shape; never accept an untyped `object`.
* Validate with `class-validator` decorators on DTOs; enable a global `ValidationPipe`
  (`whitelist: true`, `forbidNonWhitelisted: true`) rather than validating manually per handler.
* Use `class-transformer` for serialization; keep response shapes explicit (a response DTO or
  `ClassSerializerInterceptor`), don't leak internal entity fields by default.

## Error Handling

* Throw Nest's built-in HTTP exceptions (`BadRequestException`, `NotFoundException`, ...) for
  expected error conditions; let unexpected errors propagate to a global exception filter.
* Never swallow errors silently (empty `catch`); log with context or rethrow.
* Keep error messages free of internal implementation detail (stack traces, query strings) in
  production responses.

## Configuration

* Use `@nestjs/config` (`ConfigService`) for all environment-dependent values.
* Never hardcode secrets, connection strings, or environment-specific URLs — read them through
  config, validate required env vars at startup (a config schema, e.g. via `Joi` or `zod`).

## Guards, Interceptors, Pipes

* Use guards for authN/authZ, not manual checks scattered in controllers.
* Use interceptors for cross-cutting concerns (logging, response shaping, caching) rather than
  duplicating that logic per handler.
* Prefer built-in pipes (`ParseIntPipe`, `ValidationPipe`, ...) over manual parsing/validation.

## File Organization

* Modules: `src/<feature>/<feature>.module.ts`
* Controllers: `src/<feature>/<feature>.controller.ts`
* Services: `src/<feature>/<feature>.service.ts`
* DTOs: `src/<feature>/dto/<name>.dto.ts`
* Entities/schemas: `src/<feature>/entities/<name>.entity.ts`

## Naming

* Files: kebab-case with type suffix, for example `create-user.dto.ts`.
* Classes (controllers/services/modules/DTOs): PascalCase with the matching suffix
  (`UsersController`, `UsersService`, `UsersModule`, `CreateUserDto`).
* Functions/variables: camelCase.
* Constants: SCREAMING_SNAKE_CASE.
* Interfaces/types: PascalCase, no `I` prefix.

## Security

* Never commit secrets, tokens, API keys, passwords, or credentials.
* Validate and sanitize all external input via DTOs — never trust request data.
* Use guards to enforce authentication/authorization on every non-public route.
* Do not hardcode environment-specific values (URLs, ports, credentials).

## Testing

* Unit tests: `*.spec.ts` colocated with the file under test, using Nest's `TestingModule` to
  build a minimal module graph and mock external dependencies.
* E2e tests: under `test/`, exercising real HTTP routes via `supertest`.
* Mock external services/repositories with Jest mocks or test doubles, not real network/DB calls,
  in unit tests.
* Add or update tests when business logic, validation, or route behavior changes.

## Code Quality

* No commented-out code.
* No dead code.
* No debug leftovers:

  * `console.log`
  * `console.debug`
  * temporary mock data
  * test-only production code
* Keep functions and services small and focused.
* Avoid too much nesting.
* Avoid unrelated refactoring.
* Avoid unnecessary abstractions and dependencies.
* Use `const` where possible.

## Final Self-Check

Before finishing, check the current diff for:

* controllers containing business logic that belongs in a service
* missing DTO validation on a new route
* unused code
* debug leftovers (`console.log`, commented-out code)
* unnecessary `any`
* floating promises (missing `await`/`.catch`/`void`)
* hardcoded config/secrets that should go through `ConfigService`
* new files that are unused or disconnected

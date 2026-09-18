# nestjs-template project overview

Durable reference template for the `feature` skill: a real, working NestJS application skeleton
(`nest new`, ESLint/Jest configured) kept specifically so
`feature-implementer`/`feature-tester`/`feature-reviewer` have a real NestJS backend stack to
exercise — not a throwaway, not deleted after use. `projects/nestjs-template/` holds the app
itself; this file and [`coding-standards.md`](coding-standards.md) are the sole place its overview
and coding standards live (the project carries no `CLAUDE.md` of its own — see root `CLAUDE.md`'s
Projects table).

## Stack

- NestJS 11, TypeScript strict mode, Express platform (`@nestjs/platform-express`).
- ESLint (flat config, `typescript-eslint`) + Prettier, Jest for unit and e2e tests.

## Commands

- `npm run build` — compiles via `nest build`.
- `npm run test` — unit tests (`*.spec.ts` under `src/`).
- `npm run test:e2e` — end-to-end tests (`test/`).
- `npm run lint` — ESLint with `--fix`.

## Coding standards

See [`coding-standards.md`](coding-standards.md).

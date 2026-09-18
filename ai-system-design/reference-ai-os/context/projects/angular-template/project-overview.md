# angular-template project overview

Durable reference template for the `feature` skill: a real, working Angular application
skeleton (`ng new`, standalone components, ESLint/Vitest configured) kept specifically so
`feature-implementer`/`feature-tester`/`feature-reviewer` have a real Angular stack to exercise —
not a throwaway, not deleted after use. `projects/angular-template/` holds the app itself; this
file and [`coding-standards.md`](coding-standards.md) are the sole place its overview and coding
standards live (the project carries no `CLAUDE.md` of its own — see root `CLAUDE.md`'s Projects
table).

## Stack

- Angular 22 (standalone components, Signals-first), TypeScript strict mode, SCSS.
- ESLint via `@angular-eslint/schematics`, Vitest (via `@angular/build`) for unit tests.

## Commands

- `npm run build` — production build.
- `npm run test` — unit tests (`--watch=false` for a single non-interactive run).
- `npm run lint` — ESLint.

## Coding standards

See [`coding-standards.md`](coding-standards.md).

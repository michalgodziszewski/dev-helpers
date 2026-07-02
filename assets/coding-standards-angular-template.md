# Coding Standards - Angular

<!-- Template: Angular. Select this template explicitly during context initialization. -->

## Core Rules

* Use Angular 18+ patterns.
* Use strict TypeScript.
* Do not use `any`; use proper types or `unknown`.
* Prefer standalone components.
* Use `inject()` for dependency injection unless the file already follows constructor injection.
* Use Signals for local state where appropriate.
* Use `computed()` for derived state.
* Use `effect()` only for real side effects.
* Use `takeUntilDestroyed()` or another safe cleanup for manual subscriptions.
* Prefer `async` pipe, Signals, or RxJS composition over manual subscriptions.
* Use lazy loading for feature routes where appropriate.
* Use `OnPush` change detection where appropriate.

## Angular Templates

* Use modern Angular control flow by default:

  * `@if` instead of `*ngIf`
  * `@for` instead of `*ngFor`
  * `@switch` instead of `ngSwitch`
* Do not introduce new legacy structural directives in new or heavily modified templates.
* Keep legacy syntax only when the surrounding file is already legacy and changing it would be unrelated noise.
* Every `@for` must include a meaningful `track` expression.
* Do not call heavy methods or expensive calculations from templates.
* Keep template expressions simple and readable.

## TypeScript

* Define types or interfaces for API responses, DTOs, form models, and shared models.
* Use type inference where obvious.
* Use explicit types where they improve readability.
* Avoid unnecessary type assertions.
* Handle `null` and `undefined` explicitly.
* Remove unused imports, variables, functions, types, interfaces, constants, and classes.

## RxJS

* Avoid nested subscriptions.
* Use the correct RxJS operator for the business case.
* Prefer composition with `switchMap`, `mergeMap`, `concatMap`, `combineLatest`, and `withLatestFrom`.
* Do not leave subscriptions, timers, or event listeners without cleanup.
* Avoid unnecessary Subjects when Signals, inputs, or simple streams are enough.

## Forms

* Prefer typed reactive forms.
* Keep form model types explicit.
* Put reusable validation logic into validators.
* Avoid putting business logic directly in templates.

## File Organization

* Components: `src/app/[feature]/component-name.component.ts`
* Services: `src/app/[feature]/service-name.service.ts`
* Directives: `src/app/shared/directives/directive-name.directive.ts`
* Pipes: `src/app/shared/pipes/pipe-name.pipe.ts`
* Types/models: `src/app/[feature]/models/model-name.ts`

## Naming

* Files: kebab-case with type suffix, for example `user-profile.component.ts`.
* Components/services/classes: PascalCase.
* Functions/variables: camelCase.
* Constants: SCREAMING_SNAKE_CASE.
* Types/interfaces: PascalCase, no `I` prefix.

## Styling

* Use SASS for component styles.
* No inline styles.
* Prefer component-scoped styles.
* Avoid unnecessary global styles.

## Performance

* Use `@for` with `track` for lists.
* Use pure pipes for expensive computations.
* Avoid direct DOM manipulation.
* Use `NgOptimizedImage` for important images.
* Avoid creating new object or array references in templates.
* Avoid expensive calculations during change detection.

## Accessibility

* Use semantic HTML.
* Inputs must have labels.
* Interactive elements must be keyboard accessible.
* Use buttons for actions and links for navigation.
* Preserve visible focus states.

## Security

* Avoid `innerHTML`.
* Do not commit secrets, tokens, API keys, passwords, or credentials.
* Do not hardcode environment-specific values.
* Rely on Angular sanitization unless there is a clear reason not to.

## Testing

* Use `*.spec.ts`.
* Follow Arrange-Act-Assert.
* Test components with `TestBed`.
* Mock services with `jasmine.createSpyObj` or clear test doubles.
* Add or update tests when business logic, validation, state, or important UI behavior changes.

## Code Quality

* No commented-out code.
* No dead code.
* No debug leftovers:

  * `console.log`
  * `console.debug`
  * `debugger`
  * temporary mock data
  * test-only production code
* Keep functions small and focused.
* Avoid too much nesting.
* Avoid unrelated refactoring.
* Avoid unnecessary abstractions and dependencies.
* Use `const` where possible.

## Final Self-Check

Before finishing, check the current diff for:

* new `*ngIf`, `*ngFor`, or `ngSwitch`
* missing `track` in `@for`
* unused code
* debug leftovers
* commented-out code
* unnecessary `any`
* missing cleanup for subscriptions, timers, or listeners
* new files that are unused or disconnected

# Coding Standards - Angular

<!-- Template: Angular. Select this template explicitly during context initialization. -->

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful
- Organize files: imports, definition, implementation

## Angular

- Use standalone components when applicable
- Leverage Angular's signals system for state management
- Use the `inject` function for service injection
- Implement lazy loading for feature modules
- Use deferrable views for optimizing component rendering
- Async pipe for observables in templates

## File Organization

- Components: `src/app/[feature]/component-name.component.ts`
- Services: `src/app/[feature]/service-name.service.ts`
- Modules: `src/app/[feature]/feature-name.module.ts`
- Directives: `src/app/shared/directives/directive-name.directive.ts`
- Pipes: `src/app/shared/pipes/pipe-name.pipe.ts`
- Types: `src/app/[feature]/models/model-name.ts`

## Naming

- Files: kebab-case with type suffix (`user-profile.component.ts`)
- Components: PascalCase (`UserProfileComponent`)
- Services: PascalCase (`UserService`)
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- SASS for component styles
- Use Angular's view encapsulation
- No inline styles
- Component-scoped styles by default

## Import Order

1. Angular core and common modules
2. RxJS modules
3. Other Angular modules
4. Application core imports
5. Shared module imports
6. Environment-specific imports
7. Relative path imports

## Data Fetching

- Use `HttpClient` for API calls
- Wrap API calls in services
- Validate all inputs with class-validator or custom validators
- Use interceptors for auth headers and error handling

## Error Handling

- Use proper error handling in services and components
- Use custom error types or factories
- Implement Angular form validation or custom validators
- Global error handler for uncaught exceptions

## Testing

- Follow the Arrange-Act-Assert pattern
- Use `*.spec.ts` for test files
- Test components with `TestBed`
- Mock services with `jasmine.createSpyObj` or test doubles

## Performance

- Optimize `*ngFor` with `trackBy` functions
- Use pure pipes for expensive computations
- Avoid direct DOM manipulation; use Angular's templating system
- Use `NgOptimizedImage` for image loading
- Use signals to reduce unnecessary re-renders

## Security

- Prevent XSS with Angular's built-in sanitization
- Avoid `innerHTML`; sanitize dynamic content with built-in tools
- Use CSRF protection for form submissions

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible
- Use `const` for immutable variables
- Use template strings for string interpolation

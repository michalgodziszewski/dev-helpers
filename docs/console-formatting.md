# Console Formatting

Shared console output formatting for `dev` CLI commands.

**Module:** `src/cli/format/console.ts`

## Key-Value Output

Labels before `:` are rendered **bold**. Values after `:` are formatted independently based on semantic context.

```
Label: value
```

Example output:

```
Repository: my-project
Current branch: feature/LSG-12345-add-user-search
Base branch: trunk
```

## Status Markers

Status lines use clear markers that communicate state without relying on color alone:

| Marker | Meaning |
|---|---|
| `✓` | OK / healthy state |
| `!` | Warning / requires attention |
| `✖` | Error / failed state |

Example output:

```
✓ Working tree: clean
! Tracking branch: not configured
✖ Base branch not found: trunk
```

## Color Semantics

When colors are enabled, the following semantic colors are applied:

| Color | Usage |
|---|---|
| Green | OK states (✓ marker and value) |
| Yellow | Warnings (! marker and value) |
| Red | Errors (✖ marker and value) |
| Cyan | Branch names, Git refs, important identifiers |
| Dim/gray | Hints, paths, less important details |
| Bold | Labels before `:` |
| Default | Neutral information |

## NO_COLOR Support

The formatting module respects the `NO_COLOR` environment variable ([no-color.org](https://no-color.org/)).

When `NO_COLOR` is set:

- No ANSI color escape sequences are printed.
- Output remains readable.
- Labels and values are still visible.
- Status markers (`✓`, `!`, `✖`) are still printed.

Example:

```bash
NO_COLOR=1 dev some-command
```

## API

| Function | Purpose |
|---|---|
| `colorsEnabled()` | Returns `true` when color output should be used |
| `bold(text)` | Wrap text in bold |
| `dim(text)` | Wrap text in dim/gray |
| `green(text)` | Wrap text in green |
| `yellow(text)` | Wrap text in yellow |
| `red(text)` | Wrap text in red |
| `cyan(text)` | Wrap text in cyan |
| `formatKeyValue(label, value)` | Bold label, plain value |
| `formatSuccess(label, value)` | `✓` marker, green value |
| `formatWarning(label, value)` | `!` marker, yellow value |
| `formatError(label, value)` | `✖` marker, red value |
| `formatBranch(ref)` | Cyan-highlighted branch or Git ref |
| `formatHint(text)` | Dim hint text |
| `formatInfo(label, value)` | Neutral key-value (alias for `formatKeyValue`) |

## Usage

```typescript
import {
  formatKeyValue,
  formatSuccess,
  formatWarning,
  formatError,
  formatBranch,
  formatHint,
} from "../format/console.js";

console.log(formatKeyValue("Repository", "my-project"));
console.log(formatKeyValue("Current branch", formatBranch("feature/LSG-12345")));
console.log(formatSuccess("Working tree", "clean"));
console.log(formatWarning("Tracking branch", "not configured"));
console.log(formatError("Base branch not found", "trunk"));
console.log(formatHint("Run dev status for details"));
```

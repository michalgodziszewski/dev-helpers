/**
 * Shared console formatting for dev CLI commands.
 *
 * Provides semantic formatting helpers for consistent terminal output.
 * Respects the NO_COLOR environment variable (https://no-color.org/).
 *
 * Status markers:
 *   ✓  OK / healthy state
 *   !  warning / requires attention
 *   ✖  error / failed state
 *
 * Color semantics (when colors are enabled):
 *   green   — OK states
 *   yellow  — warnings
 *   red     — errors
 *   cyan    — branch names, Git refs, important identifiers
 *   dim     — hints, paths, less important details
 *   bold    — labels before ":"
 *   default — neutral information
 */

// ANSI escape sequences

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

/** Returns true when color output should be used. */
export function colorsEnabled(): boolean {
  return !process.env["NO_COLOR"];
}

function wrap(code: string, text: string): string {
  if (!colorsEnabled()) return text;
  return `${code}${text}${RESET}`;
}

// --- Low-level style helpers ---

export function bold(text: string): string {
  return wrap(BOLD, text);
}

export function dim(text: string): string {
  return wrap(DIM, text);
}

export function green(text: string): string {
  return wrap(GREEN, text);
}

export function yellow(text: string): string {
  return wrap(YELLOW, text);
}

export function red(text: string): string {
  return wrap(RED, text);
}

export function cyan(text: string): string {
  return wrap(CYAN, text);
}

// --- Semantic formatting helpers ---

/**
 * Format a key-value line.
 * Label is bold, value uses default color.
 *
 * Example: "Repository: my-project"
 */
export function formatKeyValue(label: string, value: string): string {
  return `${bold(label + ":")} ${value}`;
}

/**
 * Format a success status line with ✓ marker.
 * Marker and value are green.
 *
 * Example: "✓ Working tree: clean"
 */
export function formatSuccess(label: string, value: string): string {
  return `${green("✓")} ${bold(label + ":")} ${green(value)}`;
}

/**
 * Format a warning status line with ! marker.
 * Marker and value are yellow.
 *
 * Example: "! Tracking branch: not configured"
 */
export function formatWarning(label: string, value: string): string {
  return `${yellow("!")} ${bold(label + ":")} ${yellow(value)}`;
}

/**
 * Format an error status line with ✖ marker.
 * Marker and value are red.
 *
 * Example: "✖ Base branch not found: trunk"
 */
export function formatError(label: string, value: string): string {
  return `${red("✖")} ${bold(label + ":")} ${red(value)}`;
}

/**
 * Format a branch name or Git reference.
 * Highlighted in cyan.
 *
 * Example: "feature/LSG-12345-add-user-search"
 */
export function formatBranch(ref: string): string {
  return cyan(ref);
}

/**
 * Format hint text (paths, secondary info).
 * Rendered dim/gray.
 *
 * Example: "Run dev status for details"
 */
export function formatHint(text: string): string {
  return dim(text);
}

/**
 * Format a neutral info line (no marker, default color).
 *
 * Example: "Repository: my-project"
 */
export function formatInfo(label: string, value: string): string {
  return formatKeyValue(label, value);
}

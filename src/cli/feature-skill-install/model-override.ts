export interface ModelOverride {
  sonnet: string;
  haiku: string;
}

const MODEL_LINE_PATTERN = /^model: (sonnet|haiku)$/m;

/** Rewrite the frontmatter `model:` line to the override value for its alias role. */
export function applyModelOverride(content: string, override: ModelOverride): string {
  return content.replace(MODEL_LINE_PATTERN, (_match, alias: "sonnet" | "haiku") => {
    return `model: ${override[alias]}`;
  });
}

export interface ModelOverride {
  sonnet: string;
  haiku: string;
}

export type AgentRole = "sonnet" | "haiku";

/** Each installed agent's alias role, fixed by its template — not derived from the current `model:` value, which may already hold a pinned model ID or a previously applied override. */
export const AGENT_ROLES: Record<string, AgentRole> = {
  "test.md": "sonnet",
  "explain.md": "sonnet",
  "plan-research.md": "sonnet",
  "docs-sync.md": "sonnet",
  "code-review.md": "sonnet",
  "git-verify.md": "haiku",
};

const MODEL_LINE_PATTERN = /^model: .+$/m;

/** Rewrite the frontmatter `model:` line to the override value for the given role. */
export function applyModelOverride(content: string, override: ModelOverride, role: AgentRole): string {
  return content.replace(MODEL_LINE_PATTERN, `model: ${override[role]}`);
}

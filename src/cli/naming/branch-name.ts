import { slugify } from "../utils/slugify.js";

export const WORK_TYPES = ["feature", "bugfix", "fix", "hotfix", "chore"] as const;
export type WorkType = typeof WORK_TYPES[number];

export const DEFAULT_WORK_TYPE: WorkType = "feature";

export function isWorkType(value: string): value is WorkType {
  return (WORK_TYPES as readonly string[]).includes(value);
}

export function buildBranchName(type: WorkType, ticket: string, description?: string[]): string {
  if (!description || description.length === 0) {
    return `${type}/${ticket}`;
  }

  const slug = slugify(description);
  if (!slug) {
    return `${type}/${ticket}`;
  }

  return `${type}/${ticket}-${slug}`;
}

export type ItemStatus = "created" | "copied" | "exists" | "skipped" | "blocked";

export interface StatusEntry {
  status: ItemStatus;
  path: string;
  detail?: string;
}

export type SkillScope = "global" | "project";

export interface InstallResult {
  skillScope: SkillScope;
  skillDestination: string;
  entries: StatusEntry[];
  codingStandards: string | null;
  incomplete: boolean;
}

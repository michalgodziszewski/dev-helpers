export type ItemStatus =
  | "created"
  | "copied"
  | "merged"
  | "exists"
  | "skipped"
  | "declined"
  | "blocked";

export interface StatusEntry {
  status: ItemStatus;
  path: string;
  detail?: string;
}

export type SkillScope = "global" | "project";

export type IgnoreDestination = "track" | "gitignore" | "exclude";

export interface InstallResult {
  skillScope: SkillScope;
  skillDestination: string;
  entries: StatusEntry[];
  codingStandards: string | null;
  incomplete: boolean;
}

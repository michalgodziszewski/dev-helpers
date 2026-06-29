import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as dotenvConfig } from "dotenv";

export const FALLBACK_BASE_BRANCH = "trunk";
const ENV_BASE_BRANCH_KEY = "DEV_DEFAULT_BASE_BRANCH";

export interface DevEnv {
  defaultBaseBranch: string;
}

let cached: DevEnv | undefined;

function getProjectRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // Runtime path is dist/src/cli/config/env.js — project root is four levels up
  return dirname(dirname(dirname(dirname(dirname(thisFile)))));
}

function loadDotenv(): void {
  const envPath = join(getProjectRoot(), ".env");
  if (existsSync(envPath)) {
    dotenvConfig({ path: envPath });
  }
}

export function loadDevEnv(): DevEnv {
  if (cached) return cached;

  loadDotenv();

  const defaultBaseBranch =
    process.env[ENV_BASE_BRANCH_KEY] || FALLBACK_BASE_BRANCH;

  cached = { defaultBaseBranch };
  return cached;
}

export function resolveBaseBranch(
  cliValue: string | undefined,
  env: DevEnv,
): string {
  return cliValue ?? env.defaultBaseBranch;
}

export function resetDevEnvCache(): void {
  cached = undefined;
}

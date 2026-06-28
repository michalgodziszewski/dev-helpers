#!/usr/bin/env node

import { resolve } from "node:path";
import { generate, check } from "../src/cli/docs/generate-command-docs.js";

// Compiled output lives at dist/bin/, so go up two levels to reach project root
const rootDir = resolve(import.meta.dirname, "..", "..");
const mode = process.argv[2];

if (mode === "--check") {
  const result = check(rootDir);
  if (result.ok) {
    console.log("Documentation is up to date.");
    process.exit(0);
  }

  console.error("Documentation is out of date.\n");
  for (const path of result.missing) {
    console.error(`  Missing: ${path}`);
  }
  for (const path of result.stale) {
    console.error(`  Stale:   ${path}`);
  }
  console.error("\nRun `npm run docs:generate` to update.");
  process.exit(1);
} else {
  const result = generate(rootDir);
  for (const path of result.written) {
    console.log(`Written: ${path}`);
  }
  for (const path of result.removed) {
    console.log(`Removed: ${path}`);
  }
  console.log("Done.");
}

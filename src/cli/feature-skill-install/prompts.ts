import readline from "node:readline";
import type { SkillScope } from "./types.js";
import type { ModelOverride } from "./model-override.js";
import { bold, cyan, dim } from "../format/console.js";

function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/** Format a prompt title so consecutive questions are visually separated. */
function promptTitle(text: string): string {
  return `\n${cyan("?")} ${bold(text)}\n`;
}

/** Format one numbered option line. */
function option(index: number, label: string): string {
  return `  ${cyan(String(index) + ".")} ${label}\n`;
}

export async function promptSkillScope(
  promptFn?: (question: string) => Promise<string>,
): Promise<SkillScope> {
  const doAsk =
    promptFn ??
    (async (q: string) => {
      const rl = createInterface();
      try {
        return await ask(rl, q);
      } finally {
        rl.close();
      }
    });

  const question =
    promptTitle("Where should the feature skill be installed?") +
    option(1, "Global Claude configuration") +
    option(2, "Current project") +
    `Choice ${dim("[1/2]")}: `;

  while (true) {
    const answer = await doAsk(question);
    if (answer === "1") return "global";
    if (answer === "2") return "project";
    console.log('Invalid choice. Enter "1" or "2".');
  }
}

export interface CodingStandardsChoice {
  label: string;
  assetFilename: string | null;
}

export async function promptCodingStandards(
  choices: CodingStandardsChoice[],
  promptFn?: (question: string) => Promise<string>,
): Promise<CodingStandardsChoice | null> {
  const doAsk =
    promptFn ??
    (async (q: string) => {
      const rl = createInterface();
      try {
        return await ask(rl, q);
      } finally {
        rl.close();
      }
    });

  let question = promptTitle("Select coding standards template:");
  for (let i = 0; i < choices.length; i++) {
    question += option(i + 1, choices[i].label);
  }
  question += option(choices.length + 1, "Empty file");
  question += `Choice ${dim(`[1-${choices.length + 1}]`)} ${dim('(or "c" to cancel)')}: `;

  while (true) {
    const answer = await doAsk(question);
    if (answer.toLowerCase() === "c") return null;
    const num = parseInt(answer, 10);
    if (num >= 1 && num <= choices.length) return choices[num - 1];
    if (num === choices.length + 1) return { label: "Empty file", assetFilename: null };
    console.log(`Invalid choice. Enter 1-${choices.length + 1} or "c" to cancel.`);
  }
}

export async function promptCodeReviewStack(
  choices: Array<{ label: string; assetFilename: string | null }>,
  promptFn?: (question: string) => Promise<string>,
): Promise<{ label: string; assetFilename: string | null } | null> {
  const doAsk =
    promptFn ??
    (async (q: string) => {
      const rl = createInterface();
      try {
        return await ask(rl, q);
      } finally {
        rl.close();
      }
    });

  let question = promptTitle("Select code-review subagent template:");
  for (let i = 0; i < choices.length; i++) {
    question += option(i + 1, choices[i].label);
  }
  question += option(choices.length + 1, "Skip");
  question += `Choice ${dim(`[1-${choices.length + 1}]`)}: `;

  while (true) {
    const answer = await doAsk(question);
    const num = parseInt(answer, 10);
    if (num >= 1 && num <= choices.length) return choices[num - 1];
    if (num === choices.length + 1) return null;
    console.log(`Invalid choice. Enter 1-${choices.length + 1}.`);
  }
}

export async function promptIgnoreClaudeDir(
  promptFn?: (question: string) => Promise<string>,
): Promise<boolean> {
  const doAsk =
    promptFn ??
    (async (q: string) => {
      const rl = createInterface();
      try {
        return await ask(rl, q);
      } finally {
        rl.close();
      }
    });

  const answer = await doAsk(
    promptTitle("Should the .claude/ directory be ignored by Git (added to .gitignore)?") +
      `Confirm ${dim("[Y/n]")}: `,
  );
  return answer === "" || answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

export async function promptCreateClaudeMd(
  promptFn?: (question: string) => Promise<string>,
): Promise<boolean> {
  const doAsk =
    promptFn ??
    (async (q: string) => {
      const rl = createInterface();
      try {
        return await ask(rl, q);
      } finally {
        rl.close();
      }
    });

  const answer = await doAsk(
    promptTitle("CLAUDE.md does not exist. Create it with Local Context Files references?") +
      `Confirm ${dim("[Y/n]")}: `,
  );
  return answer === "" || answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

export interface ModelOverrideChoice {
  name: string;
  override: ModelOverride;
}

/** AWS Bedrock EU cross-region inference profile names, offered as the default override since they are the most commonly reported org-specific naming scheme. */
export const BEDROCK_EU_DEFAULT_OVERRIDE: ModelOverride = {
  sonnet: "eu.anthropic.claude-sonnet-4-6",
  haiku: "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
};
const DEFAULT_PROFILE_NAME_HINT = "org";

function defaultDoAsk(promptFn?: (question: string) => Promise<string>): (question: string) => Promise<string> {
  return (
    promptFn ??
    (async (q: string) => {
      const rl = createInterface();
      try {
        return await ask(rl, q);
      } finally {
        rl.close();
      }
    })
  );
}

async function promptModelLiterals(
  doAsk: (question: string) => Promise<string>,
): Promise<ModelOverride> {
  const sonnet = await doAsk(
    promptTitle('Literal model name to use for the "sonnet" role:') +
      `${dim(`[${BEDROCK_EU_DEFAULT_OVERRIDE.sonnet}]`)}: `,
  );
  const haiku = await doAsk(
    promptTitle('Literal model name to use for the "haiku" role:') +
      `${dim(`[${BEDROCK_EU_DEFAULT_OVERRIDE.haiku}]`)}: `,
  );
  return {
    sonnet: sonnet.trim() === "" ? BEDROCK_EU_DEFAULT_OVERRIDE.sonnet : sonnet.trim(),
    haiku: haiku.trim() === "" ? BEDROCK_EU_DEFAULT_OVERRIDE.haiku : haiku.trim(),
  };
}

export async function promptModelOverride(
  promptFn?: (question: string) => Promise<string>,
): Promise<ModelOverrideChoice | null> {
  const doAsk = defaultDoAsk(promptFn);

  const useOverride = await doAsk(
    promptTitle(
      "Does your organization require literal model names instead of the default " +
        '"sonnet"/"haiku" aliases (e.g. AWS Bedrock-style eu.anthropic.claude-sonnet-4-6)?',
    ) + `Confirm ${dim("[y/N]")}: `,
  );
  if (!(useOverride.toLowerCase() === "y" || useOverride.toLowerCase() === "yes")) {
    return null;
  }

  const override = await promptModelLiterals(doAsk);
  const name = await doAsk(
    promptTitle(
      "Name this model profile (used later with `dev model-toggle <name>` to switch accounts):",
    ) + `Name ${dim(`[${DEFAULT_PROFILE_NAME_HINT}]`)}: `,
  );
  return {
    name: name.trim() === "" ? DEFAULT_PROFILE_NAME_HINT : name.trim(),
    override,
  };
}

/** Used by `dev model-toggle <name>` when the named profile does not exist yet, so a new account/org profile can be created without re-running the full installer. */
export async function promptCreateModelProfile(
  profileName: string,
  promptFn?: (question: string) => Promise<string>,
): Promise<ModelOverride | null> {
  const doAsk = defaultDoAsk(promptFn);

  const create = await doAsk(
    promptTitle(`Profile "${profileName}" does not exist. Create it now?`) +
      `Confirm ${dim("[y/N]")}: `,
  );
  if (!(create.toLowerCase() === "y" || create.toLowerCase() === "yes")) {
    return null;
  }

  return promptModelLiterals(doAsk);
}

import readline from "node:readline";
import type { SkillScope } from "./types.js";

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
    "\nWhere should the feature skill be installed?\n" +
    "  1. Global Claude configuration\n" +
    "  2. Current project\n" +
    "\nChoice [1/2]: ";

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

  const lines = ["\nSelect coding standards template:"];
  for (let i = 0; i < choices.length; i++) {
    lines.push(`  ${i + 1}. ${choices[i].label}`);
  }
  lines.push(`  ${choices.length + 1}. Empty file`);
  lines.push("");
  const question = lines.join("\n") + `Choice [1-${choices.length + 1}] (or "c" to cancel): `;

  while (true) {
    const answer = await doAsk(question);
    if (answer.toLowerCase() === "c") return null;
    const num = parseInt(answer, 10);
    if (num >= 1 && num <= choices.length) return choices[num - 1];
    if (num === choices.length + 1) return { label: "Empty file", assetFilename: null };
    console.log(`Invalid choice. Enter 1-${choices.length + 1} or "c" to cancel.`);
  }
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
    "CLAUDE.md does not exist. Create it with Local Context Files references? [Y/n] ",
  );
  return answer === "" || answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

import { CliError } from "../utils/errors.js";
import { slugify } from "../utils/slugify.js";
import { validateTicket } from "../utils/ticket.js";

const BRANCH_TYPES = new Set([
  "feat",
  "fix",
  "bugfix",
  "hotfix",
  "chore",
  "docs",
  "refactor",
  "test",
  "style",
]);

const DEFAULT_TYPE = "feat";

/**
 * Parse start command arguments.
 *
 * Accepted forms:
 *   start <TICKET> <description...>
 *   start <type> <TICKET> <description...>
 *
 * @param {string[]} args
 * @returns {{ type: string, ticket: string, description: string[] }}
 */
function parseArgs(args) {
  if (args.length < 2) {
    throw new CliError(
      [
        "Usage: dev start [<type>] <TICKET> <description...>",
        "",
        "Examples:",
        "  dev start LSG-1234 edit service package",
        "  dev start fix LSG-1234 repair login redirect",
        "",
        `Supported types: ${[...BRANCH_TYPES].join(", ")}`,
        `Default type: ${DEFAULT_TYPE}`,
      ].join("\n")
    );
  }

  let type = DEFAULT_TYPE;
  let rest = args;

  if (BRANCH_TYPES.has(args[0].toLowerCase())) {
    type = args[0].toLowerCase();
    rest = args.slice(1);

    if (rest.length < 2) {
      throw new CliError(
        `Usage: dev start ${type} <TICKET> <description...>`
      );
    }
  }

  const ticket = validateTicket(rest[0]);
  const description = rest.slice(1);

  if (description.length === 0) {
    throw new CliError("A description is required after the ticket.");
  }

  return { type, ticket, description };
}

/**
 * Execute the start command — generate and print a branch name.
 *
 * @param {string[]} args
 */
export function run(args) {
  const { type, ticket, description } = parseArgs(args);
  const slug = slugify(description);
  const branch = `${type}/${ticket}-${slug}`;

  console.log(`Generated branch:\n${branch}`);
}

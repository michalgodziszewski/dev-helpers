import { CliError } from "./errors.js";

const TICKET_PATTERN = /^[A-Z][A-Z0-9]*-[1-9][0-9]*$/;

export function validateTicket(raw: string): string {
  const ticket = raw.toUpperCase();
  if (!TICKET_PATTERN.test(ticket)) {
    throw new CliError(
      `Invalid ticket "${raw}". Expected format: ABC-1234 (e.g. LSG-1234, JURA-5678, DEV-1).`
    );
  }
  return ticket;
}

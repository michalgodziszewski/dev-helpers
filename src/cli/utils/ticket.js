import { CliError } from "./errors.js";

const TICKET_PATTERN = /^[A-Z][A-Z0-9]*-[1-9][0-9]*$/;

/**
 * Normalize a ticket string to uppercase and validate its format.
 *
 * @param {string} raw
 * @returns {string} Normalized uppercase ticket
 * @throws {CliError} When the ticket format is invalid
 */
export function validateTicket(raw) {
  const ticket = raw.toUpperCase();
  if (!TICKET_PATTERN.test(ticket)) {
    throw new CliError(
      `Invalid ticket "${raw}". Expected format: ABC-1234 (e.g. LSG-1234, JURA-5678, DEV-1).`
    );
  }
  return ticket;
}

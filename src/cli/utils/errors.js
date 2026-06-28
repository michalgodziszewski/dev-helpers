/**
 * A user-facing CLI error that should be printed without a stack trace.
 */
export class CliError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "CliError";
  }
}

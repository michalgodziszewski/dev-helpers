/**
 * Convert description words into a lowercase kebab-case slug.
 *
 * @param {string[]} words
 * @returns {string}
 */
export function slugify(words) {
  return words
    .map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean)
    .join("-");
}

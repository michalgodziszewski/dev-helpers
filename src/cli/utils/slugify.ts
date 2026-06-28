export function slugify(words: string[]): string {
  return words
    .flatMap((w) => w.split(/\s+/))
    .map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean)
    .join("-");
}

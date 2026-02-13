/**
 * Generate a URL-safe slug from a string.
 * - Lowercases
 * - Replaces spaces and special chars with hyphens
 * - Removes non-alphanumeric chars (except hyphens)
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 * - Max 80 chars
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/[\s_]+/g, "-") // Spaces/underscores → hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .slice(0, 80);
}

/**
 * Validate a slug format.
 * Returns null if valid, or an error message.
 */
export function validateSlug(slug: string): string | null {
  if (!slug || slug.length < 2) {
    return "Slug must be at least 2 characters";
  }
  if (slug.length > 80) {
    return "Slug must be 80 characters or less";
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing/double hyphens)";
  }
  return null;
}

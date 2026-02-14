/**
 * Slug utility module
 * Provides functions to generate and validate URL-safe slugs.
 */

/**
 * Convert any string to a valid URL slug.
 * @param {string} input - The string to slugify.
 * @returns {string} A URL-safe slug.
 */
export function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents/diacritics
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric chars with hyphens
    .replace(/-{2,}/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens
}

/**
 * Validate a slug string.
 * @param {string} slug - The slug to validate.
 * @returns {string|null} An error message if invalid, or null if valid.
 */
export function validateSlug(slug) {
  if (!slug || slug.length < 2) {
    return "Slug must be at least 2 characters long.";
  }

  if (slug.length > 120) {
    return "Slug must be at most 120 characters long.";
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug must contain only lowercase letters, numbers, and hyphens.";
  }

  if (slug.startsWith("-") || slug.endsWith("-")) {
    return "Slug must not start or end with a hyphen.";
  }

  if (/--/.test(slug)) {
    return "Slug must not contain consecutive hyphens.";
  }

  return null;
}

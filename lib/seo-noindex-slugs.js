// Product slugs that should get robots noindex when rendered as standalone pages.
// These are non-canonical slugs that have 301 redirects configured, but noindex
// provides defense-in-depth in case the redirect is bypassed or misconfigured.
//
// To add slugs: append to the Set below. To remove: delete the line.

import { codexUrlMappingRedirects } from "./redirects/codex-url-mapping";

const _set = new Set();

// Extract product slugs from /shop/category/slug redirect sources
for (const r of codexUrlMappingRedirects) {
  const m = r.source.match(/^\/shop\/[^/]+\/([^/]+)$/);
  if (m) _set.add(m[1]);
}

// Product slugs that 308-redirect to parent landing pages (sub-product children).
// Exclude from sitemap to avoid sending crawlers to redirect URLs.
const REDIRECT_CHILD_SLUGS = [
  "sticker-sheets", "kiss-cut-sticker-sheets", "transfer-vinyl-lettering",
  "clear-labels", "white-bopp-labels",
];
for (const s of REDIRECT_CHILD_SLUGS) _set.add(s);

export const SEO_NOINDEX_SLUGS = _set;

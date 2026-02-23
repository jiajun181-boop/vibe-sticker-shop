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

export const SEO_NOINDEX_SLUGS = _set;

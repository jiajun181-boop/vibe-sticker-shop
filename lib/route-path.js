export function stripLocalePrefix(pathname = "/") {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const stripped = normalized.replace(/^\/zh(?=\/|$)/, "");
  return stripped || "/";
}

export function isAdminRoute(pathname = "/") {
  return stripLocalePrefix(pathname).startsWith("/admin");
}

export function isDesignRoute(pathname = "/") {
  return stripLocalePrefix(pathname).startsWith("/design");
}

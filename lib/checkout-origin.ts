interface RedirectInput {
  successUrl?: string;
  cancelUrl?: string;
  baseOrigin: string;
  statusToken: string;
}

export function buildBaseOriginFromHeaders(
  headers: Headers,
  siteUrl?: string
) {
  if (siteUrl) {
    return new URL(siteUrl).origin;
  }

  const origin = headers.get("origin");
  if (origin) {
    return new URL(origin).origin;
  }

  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (host) {
    const protocol = headers.get("x-forwarded-proto") || "https";
    return `${protocol}://${host}`;
  }

  throw new Error("Unable to determine request origin");
}

export function ensureSameOriginUrl(url: string, expectedOrigin: string) {
  const parsed = new URL(url);
  if (parsed.origin !== expectedOrigin) {
    throw new Error("Redirect URLs must use the same origin");
  }
  return parsed;
}

export function buildSafeRedirectUrls({
  successUrl,
  cancelUrl,
  baseOrigin,
  statusToken,
}: RedirectInput) {
  let safeSuccessUrl = `${baseOrigin}/success?session_id={CHECKOUT_SESSION_ID}&st=${statusToken}`;
  let safeCancelUrl = `${baseOrigin}/cart`;

  if (successUrl) {
    const parsed = ensureSameOriginUrl(successUrl, baseOrigin);
    parsed.searchParams.set("st", statusToken);
    safeSuccessUrl = parsed.toString();
  }

  if (cancelUrl) {
    const parsed = ensureSameOriginUrl(cancelUrl, baseOrigin);
    safeCancelUrl = parsed.toString();
  }

  return { safeSuccessUrl, safeCancelUrl };
}

export function isStatusTokenAuthorized(
  expectedToken: string | null | undefined,
  providedToken: string | null | undefined
) {
  if (!expectedToken) return true;
  return expectedToken === providedToken;
}

export function shouldIncludeSensitiveStatusFields(
  expectedToken: string | null | undefined,
  providedToken: string | null | undefined
) {
  return Boolean(expectedToken && expectedToken === providedToken);
}

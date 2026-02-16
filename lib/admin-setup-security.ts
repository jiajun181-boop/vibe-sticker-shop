export function isSetupTokenRequired(
  nodeEnv: string | undefined,
  setupTokenRequired: string | undefined
) {
  return nodeEnv === "production" && !setupTokenRequired;
}

export function isSetupTokenAccepted(
  setupTokenRequired: string | undefined,
  providedToken: string | undefined
) {
  if (!setupTokenRequired) return true;
  if (!providedToken) return false;
  try {
    const a = Buffer.from(setupTokenRequired);
    const b = Buffer.from(providedToken);
    if (a.length !== b.length) return false;
    return require("crypto").timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

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
  return providedToken === setupTokenRequired;
}

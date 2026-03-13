export const LEGACY_ADMIN_USER = {
  id: "legacy-password-admin",
  email: "admin@local",
  name: "Legacy Admin",
  role: "admin",
} as const;

export function hasLegacyAdminPasswordConfigured(
  adminPassword = process.env.ADMIN_PASSWORD || ""
): boolean {
  return adminPassword.trim().length > 0;
}

export function matchesLegacyAdminPassword(
  inputPassword: string,
  adminPassword = process.env.ADMIN_PASSWORD || ""
): boolean {
  const expected = adminPassword.trim();
  const actual = (inputPassword || "").trim();
  if (!expected || actual.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }

  return mismatch === 0;
}

export function getAdminRuntimeFailure(err: unknown): {
  error: string;
  status: number;
} {
  const name =
    err && typeof err === "object" && "name" in err ? String(err.name) : "";
  const message =
    err && typeof err === "object" && "message" in err
      ? String(err.message)
      : "";
  const lowered = `${name} ${message}`.toLowerCase();

  if (message.includes("ADMIN_JWT_SECRET env var is required")) {
    return {
      error: "Admin session secret is not configured.",
      status: 500,
    };
  }

  if (lowered.includes("environment variable not found: database_url")) {
    return {
      error: "Admin database is not configured.",
      status: 500,
    };
  }

  if (
    name === "PrismaClientInitializationError" ||
    lowered.includes("can't reach database server") ||
    lowered.includes("unable to reach the database server") ||
    lowered.includes("database server") ||
    lowered.includes("connection pool") ||
    lowered.includes("timed out")
  ) {
    return {
      error: "Admin database is unavailable.",
      status: 503,
    };
  }

  return {
    error: "Login failed",
    status: 500,
  };
}

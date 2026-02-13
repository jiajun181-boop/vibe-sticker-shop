import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { hasPermission } from "./admin-permissions";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret-change-me"
);
const COOKIE_NAME = "admin_session";
const TOKEN_TTL = "24h";

/**
 * Create a signed JWT token for an admin user.
 */
export async function createAdminToken(adminUser) {
  return new SignJWT({
    sub: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token.
 * @returns {{ sub, email, name, role } | null}
 */
export async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract admin session from request cookie.
 * @returns {{ authenticated: boolean, user?: object, response?: NextResponse }}
 */
export async function getAdminSession(request) {
  // Try new JWT-based session first
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  if (sessionCookie) {
    const payload = await verifyAdminToken(sessionCookie.value);
    if (payload) {
      return {
        authenticated: true,
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
      };
    }
  }

  // Backwards compatibility: old simple cookie (treat as admin role)
  const legacyCookie = request.cookies.get("admin_auth");
  if (legacyCookie && legacyCookie.value === "authenticated") {
    return {
      authenticated: true,
      user: {
        id: "legacy",
        email: "admin@legacy",
        name: "Admin",
        role: "admin",
      },
    };
  }

  return {
    authenticated: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

/**
 * Legacy compatibility: synchronous auth check (no role info).
 * Use getAdminSession() for async role-aware checks.
 */
export function requireAdminAuth(request) {
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  const legacyCookie = request.cookies.get("admin_auth");

  if (
    (sessionCookie && sessionCookie.value) ||
    (legacyCookie && legacyCookie.value === "authenticated")
  ) {
    return { authenticated: true };
  }

  return {
    authenticated: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

/**
 * Require admin session with permission check.
 * @param {Request} request
 * @param {string} module - Module name (e.g., "orders", "products")
 * @param {string} action - Required action ("view" | "edit" | "approve" | "admin")
 * @returns {{ authenticated: boolean, user?: object, response?: NextResponse }}
 */
export async function requirePermission(request, module, action = "view") {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session;

  if (!hasPermission(session.user.role, module, action)) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return session;
}

export { COOKIE_NAME, JWT_SECRET };

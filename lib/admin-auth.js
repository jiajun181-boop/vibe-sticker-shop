import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { hasPermission } from "./admin-permissions";

const COOKIE_NAME = "admin_session";
const TOKEN_TTL = "24h";

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET env var is required");
  }
  return new TextEncoder().encode(secret);
}

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
    .sign(getJwtSecret());
}

/**
 * Verify and decode a JWT token.
 * @returns {{ sub, email, name, role } | null}
 */
export async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
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

  return {
    authenticated: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

/**
 * @deprecated UNSAFE — checks cookie presence only, does NOT verify JWT signature.
 * Only used by scripts/upgrade-rbac.mjs (offline migration script).
 * DO NOT use in API routes — use requirePermission() instead.
 */
export function requireAdminAuth(request) {
  const sessionCookie = request.cookies.get(COOKIE_NAME);
  if (sessionCookie && sessionCookie.value) {
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

export { COOKIE_NAME };

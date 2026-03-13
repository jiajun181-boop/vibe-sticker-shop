import { NextRequest, NextResponse } from "next/server";
import { adminLoginLimiter, getClientIp } from "@/lib/rate-limit";
import { checkDbRateLimit, recordLoginAttempt } from "@/lib/db-rate-limit";
import {
  getAdminRuntimeFailure,
  hasLegacyAdminPasswordConfigured,
  LEGACY_ADMIN_USER,
  matchesLegacyAdminPassword,
} from "@/lib/admin-login";

function recordAdminLogin(ip: string, success: boolean) {
  recordLoginAttempt(ip, "admin-login", success).catch(() => {});
}

async function createSessionResponse(
  user: { id: string; name?: string | null; email: string; role: string },
  payload?: Record<string, unknown>
) {
  const { createAdminToken, COOKIE_NAME } = await import("@/lib/admin-auth");
  const token = await createAdminToken(user);
  const response = NextResponse.json(payload || { success: true });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}

async function createLegacyLoginResponse() {
  return createSessionResponse(LEGACY_ADMIN_USER);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Fast in-memory check (works within warm instances)
    const { success } = adminLoginLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    // DB-backed check (persists across cold starts)
    const dbCheck = await checkDbRateLimit(ip, {
      windowMs: 15 * 60 * 1000,
      max: 5,
      route: "admin-login",
    });
    if (!dbCheck.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword =
      typeof password === "string" ? password.normalize("NFKC") : "";
    const hasLegacyPassword = hasLegacyAdminPasswordConfigured();
    const legacyPasswordAccepted = matchesLegacyAdminPassword(normalizedPassword);

    // New path: email + password login (AdminUser table)
    let emailLoginFailure: unknown = null;
    if (normalizedEmail) {
      try {
        // Dynamic imports to avoid crashing legacy path if prisma isn't ready
        const { prisma } = await import("@/lib/prisma");
        const bcrypt = (await import("bcryptjs")).default;

        const candidates = await prisma.adminUser.findMany({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            isActive: true,
          },
          orderBy: [{ lastLoginAt: "desc" }, { createdAt: "desc" }],
        });

        let admin = null;
        for (const candidate of candidates) {
          const ok = await bcrypt.compare(normalizedPassword, candidate.passwordHash);
          if (ok) {
            admin = candidate;
            break;
          }
        }

        if (admin) {
          const response = await createSessionResponse(admin, {
            success: true,
            user: {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role,
            },
          });

          // Treat login bookkeeping as best-effort so session issuance still wins.
          prisma.adminUser
            .update({
              where: { id: admin.id },
              data: { lastLoginAt: new Date() },
            })
            .catch(() => {});

          recordAdminLogin(ip, true);
          return response;
        }
      } catch (err) {
        emailLoginFailure = err;
      }

      // Preserve legacy single-password access during migration and outages.
      if (legacyPasswordAccepted) {
        const response = await createLegacyLoginResponse();
        recordAdminLogin(ip, true);
        return response;
      }

      if (emailLoginFailure) {
        console.error("[Admin Login] Email login error:", emailLoginFailure);
        const failure = getAdminRuntimeFailure(emailLoginFailure);
        return NextResponse.json(
          { error: failure.error },
          { status: failure.status }
        );
      }

      recordAdminLogin(ip, false);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Legacy path: password-only login (env ADMIN_PASSWORD)
    if (!hasLegacyPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }

    if (!legacyPasswordAccepted) {
      recordAdminLogin(ip, false);
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const response = await createLegacyLoginResponse();
    recordAdminLogin(ip, true);
    return response;
  } catch (err) {
    console.error("[Admin Login] Error:", err);
    const failure = getAdminRuntimeFailure(err);
    return NextResponse.json(
      { error: failure.error },
      { status: failure.status }
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("admin_session");
    response.cookies.delete("admin_auth");
    return response;
  } catch (err) {
    console.error("[Admin Logout] Error:", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import {
  hasLegacyAdminPasswordConfigured,
  LEGACY_ADMIN_USER,
  matchesLegacyAdminPassword,
} from "@/lib/admin-login";
import { adminLoginLimiter, getClientIp } from "@/lib/rate-limit";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = adminLoginLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const password =
      typeof body?.password === "string" ? body.password.normalize("NFKC") : "";

    if (!hasLegacyAdminPasswordConfigured()) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }

    if (!matchesLegacyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = await createAdminToken(LEGACY_ADMIN_USER);
    const response = NextResponse.json({ success: true, legacy: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error("[Admin Legacy Login] Error:", err);

    if (err instanceof Error && err.message.includes("ADMIN_JWT_SECRET env var is required")) {
      return NextResponse.json(
        { error: "Admin session secret is not configured." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

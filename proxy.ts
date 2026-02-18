import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const DEFAULT_LOCALE = "en";

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function isValidAdminJwt(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get("admin_session");
  if (!cookie?.value) return false;
  const secret = getJwtSecret();
  if (!secret) return false;
  try {
    await jwtVerify(cookie.value, secret);
    return true;
  } catch {
    return false;
  }
}

function detectLocale(request: NextRequest): string {
  const acceptLang = request.headers.get("accept-language") || "";
  const langs = acceptLang.split(",").map((part) => {
    const [lang] = part.trim().split(";");
    return lang.trim().toLowerCase();
  });
  for (const lang of langs) {
    if (lang.startsWith("zh")) return "zh";
    if (lang.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // i18n URL routing: /zh/xxx → rewrite to /xxx + set locale cookie
  if (path.startsWith("/zh")) {
    const strippedPath = path.replace(/^\/zh/, "") || "/";
    const url = request.nextUrl.clone();
    url.pathname = strippedPath;
    const response = NextResponse.rewrite(url);
    response.cookies.set("locale", "zh", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const response = NextResponse.next();

  // Auto-detect locale on first visit (no locale cookie yet)
  const localeCookie = request.cookies.get("locale");
  if (!localeCookie) {
    const detected = detectLocale(request);
    response.cookies.set("locale", detected, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // Protect /admin routes (except login page) - verify JWT signature
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const valid = await isValidAdminJwt(request);
    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /account routes (redirect to login if no session)
  if (path.startsWith("/account")) {
    const sessionCookie = request.cookies.get("session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all page routes, exclude static/api/_next
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};

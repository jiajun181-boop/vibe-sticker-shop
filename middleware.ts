import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["en", "zh"];
const DEFAULT_LOCALE = "en";

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

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
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

  // Protect /admin routes (except login page and login API)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const auth = request.cookies.get("admin_auth");
    if (!auth || auth.value !== "authenticated") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
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

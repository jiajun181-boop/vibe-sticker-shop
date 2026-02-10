import { NextResponse } from "next/server";

export function requireAdminAuth(request) {
  const cookie = request.cookies.get("admin_auth");
  if (!cookie || cookie.value !== "authenticated") {
    return {
      authenticated: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { authenticated: true };
}

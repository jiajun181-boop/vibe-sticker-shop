import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

// GET /api/admin/session — Return current admin user info + role
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session.authenticated) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: session.user });

  } catch (err) {
    console.error("[admin/session] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

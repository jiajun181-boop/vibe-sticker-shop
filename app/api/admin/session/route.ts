import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

// GET /api/admin/session — Return current admin user info + role
export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session.authenticated) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}

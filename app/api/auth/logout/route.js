import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    return clearSessionCookie(response);

  } catch (err) {
    console.error("[auth/logout] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

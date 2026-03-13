import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    db_url_set: !!process.env.DATABASE_URL,
    db_url_preview: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.split("@")[1]?.substring(0, 50)
      : "NOT SET",
  });
}

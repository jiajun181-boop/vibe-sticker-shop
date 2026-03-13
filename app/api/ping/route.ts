import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    runtime: "nodejs",
    region: process.env.VERCEL_REGION || "unknown",
  });
}

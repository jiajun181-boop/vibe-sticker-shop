import { NextResponse } from "next/server";
import { adminLoginLimiter, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.adminUser.count();
    return NextResponse.json({
      ok: true,
      adminCount: count,
      ms: Date.now() - start,
      region: process.env.VERCEL_REGION || "local",
    });
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    });
  }
}

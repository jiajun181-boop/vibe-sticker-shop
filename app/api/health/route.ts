import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const start = Date.now();
  const info: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION || "local",
    db_url_exists: !!process.env.DATABASE_URL,
    db_url_preview: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/\/\/.*@/, "//***@").slice(0, 100)
      : "NOT SET",
  };

  try {
    const { prisma } = await import("@/lib/prisma");
    info.prisma_imported_ms = Date.now() - start;

    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as ok`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB_TIMEOUT_8S")), 8000)
      ),
    ]);
    info.db_connected = true;
    info.db_result = result;
    info.total_ms = Date.now() - start;
  } catch (err: unknown) {
    info.db_connected = false;
    info.db_error = err instanceof Error ? err.message : String(err);
    info.db_error_name = err instanceof Error ? err.constructor.name : "unknown";
    info.total_ms = Date.now() - start;
  }

  return NextResponse.json(info);
}

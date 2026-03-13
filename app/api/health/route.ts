import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const info: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env_db_url_exists: !!process.env.DATABASE_URL,
    env_db_url_preview: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/\/\/.*@/, "//***@").substring(0, 80)
      : "NOT SET",
  };

  try {
    // Simple query with a 8 second timeout via AbortController
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1 as ok`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB query timeout after 8s")), 8000)
      ),
    ]);
    info.db_connected = true;
    info.db_result = result;
    info.db_latency_ms = Date.now() - start;
  } catch (err: unknown) {
    info.db_connected = false;
    info.db_error = err instanceof Error ? err.message : String(err);
    info.db_error_name = err instanceof Error ? err.constructor.name : "unknown";
    info.db_latency_ms = Date.now() - start;
  }

  return NextResponse.json(info);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public pricing settings endpoint.
 * Returns only `pricing.*` prefixed settings for frontend components
 * (e.g., foil multipliers in BusinessCardConfigurator).
 * No admin auth required — these are not sensitive values.
 */
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: "pricing." } },
    });

    const result: Record<string, number> = {};
    for (const s of settings) {
      result[s.key] = typeof s.value === "number" ? s.value : Number(s.value);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[PricingSettings] GET error:", err);
    return NextResponse.json({}, { status: 200 }); // return empty on error — fallbacks will handle it
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PROMO_DEFAULTS = {
  textEn: "",
  textZh: "",
  link: "",
  bgColor: "#111827",
  active: false,
};

/** Public endpoint — returns promo bar config (no auth required). */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "cms.promo" },
    });
    const value = setting?.value && typeof setting.value === "object"
      ? { ...PROMO_DEFAULTS, ...(setting.value as Record<string, unknown>) }
      : PROMO_DEFAULTS;

    return NextResponse.json(value, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(PROMO_DEFAULTS);
  }
}

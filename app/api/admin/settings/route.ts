import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const settings = await prisma.setting.findMany();

    const flat: Record<string, unknown> = {};
    for (const s of settings) {
      flat[s.key] = s.value;
    }

    return NextResponse.json(flat);
  } catch (err) {
    console.error("[Settings] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Body must be a flat key-value object" },
        { status: 400 }
      );
    }

    const entries = Object.entries(body);

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: value as any },
          update: { value: value as any },
        })
      )
    );

    await logActivity({
      action: "updated",
      entity: "setting",
      details: { keys: entries.map(([k]) => k), count: entries.length },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Settings] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

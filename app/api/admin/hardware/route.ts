import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const items = await prisma.hardwareItem.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error("[Hardware GET]", err);
    return NextResponse.json({ error: "Failed to fetch hardware items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();

    if (!body.slug || !body.name || !body.category) {
      return NextResponse.json({ error: "slug, name, and category are required" }, { status: 400 });
    }

    const item = await prisma.hardwareItem.create({
      data: {
        sortOrder: body.sortOrder ?? 0,
        category: body.category,
        slug: body.slug,
        name: body.name,
        priceCents: body.priceCents ?? 0,
        unit: body.unit ?? "per_unit",
        notes: body.notes ?? null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ item });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A hardware item with this slug already exists" }, { status: 409 });
    }
    console.error("[Hardware POST]", err);
    return NextResponse.json({ error: "Failed to create hardware item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const item = await prisma.hardwareItem.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ item });
  } catch (err) {
    console.error("[Hardware PATCH]", err);
    return NextResponse.json({ error: "Failed to update hardware item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePermission(req, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await prisma.hardwareItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Hardware DELETE]", err);
    return NextResponse.json({ error: "Failed to delete hardware item" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity-log";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";

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

    logActivity({
      action: "hardware_created",
      entity: "hardware_item",
      entityId: item.id,
      actor: auth.user?.name || auth.user?.email || "admin",
      details: { name: body.name, category: body.category },
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

    // Gate price changes through approval
    if (updates.priceCents !== undefined) {
      const existing = await prisma.hardwareItem.findUnique({ where: { id }, select: { id: true, slug: true, name: true, priceCents: true } });
      if (existing) {
        const oldPrice = existing.priceCents || 0;
        const newPrice = Number(updates.priceCents) || 0;
        const driftPct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : null;

        const gate = await gateWithApproval({
          operatorRole: auth.user?.role || "unknown",
          operator: { id: auth.user?.id || "", name: auth.user?.name || auth.user?.email || "admin", role: auth.user?.role || "unknown" },
          changeType: "hardware_price_edit",
          scope: "product",
          targetId: id,
          targetSlug: existing.slug,
          targetName: existing.name,
          description: `Hardware price change: ${existing.name}`,
          changeDiff: { before: { priceCents: oldPrice }, after: { priceCents: newPrice } },
          driftPct: driftPct ?? undefined,
        });
        if (gate.needsApproval) {
          return NextResponse.json({ requiresApproval: true, approvalId: gate.approvalId, reason: gate.reason }, { status: 202 });
        }

        logPriceChange({
          productSlug: existing.slug,
          productName: existing.name,
          scope: "product",
          field: `hardware.${existing.slug}.priceCents`,
          labelBefore: `$${(oldPrice / 100).toFixed(2)}`,
          labelAfter: `$${(newPrice / 100).toFixed(2)}`,
          valueBefore: oldPrice,
          valueAfter: newPrice,
          driftPct,
          operatorId: auth.user?.id || null,
          operatorName: auth.user?.name || auth.user?.email || "admin",
          note: "owner-bypass",
        }).catch(() => {});
      }
    }

    const item = await prisma.hardwareItem.update({
      where: { id },
      data: updates,
    });

    logActivity({
      action: "hardware_updated",
      entity: "hardware_item",
      entityId: id,
      actor: auth.user?.name || auth.user?.email || "admin",
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

    logActivity({
      action: "hardware_deleted",
      entity: "hardware_item",
      entityId: id,
      actor: auth.user?.name || auth.user?.email || "admin",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Hardware DELETE]", err);
    return NextResponse.json({ error: "Failed to delete hardware item" }, { status: 500 });
  }
}

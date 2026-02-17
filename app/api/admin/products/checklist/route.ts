import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

const SUBSERIES_PREFIX = "subseries:";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "products", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const limit = Math.max(1, Math.min(200, Number(new URL(request.url).searchParams.get("limit") || "100")));
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        metaTitle: true,
        metaDescription: true,
        basePrice: true,
        pricingPresetId: true,
        tags: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    const checks = products.map((p) => {
      const hasImage = Boolean(p.images?.length);
      const hasPrice = Boolean(p.pricingPresetId) || p.basePrice > 0;
      const hasDescription = (p.description || "").trim().length >= 24;
      const hasSeo = Boolean((p.metaTitle || "").trim() && (p.metaDescription || "").trim());
      const hasSubseries = Array.isArray(p.tags) && p.tags.some((t) => typeof t === "string" && t.startsWith(SUBSERIES_PREFIX));
      const ready = hasImage && hasPrice && hasDescription && hasSeo && hasSubseries;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        ready,
        checks: { hasImage, hasPrice, hasDescription, hasSeo, hasSubseries },
      };
    });

    const summary = {
      scanned: checks.length,
      readyCount: checks.filter((x) => x.ready).length,
      notReadyCount: checks.filter((x) => !x.ready).length,
      missingImage: checks.filter((x) => !x.checks.hasImage).length,
      missingPrice: checks.filter((x) => !x.checks.hasPrice).length,
      missingDescription: checks.filter((x) => !x.checks.hasDescription).length,
      missingSeo: checks.filter((x) => !x.checks.hasSeo).length,
      missingSubseries: checks.filter((x) => !x.checks.hasSubseries).length,
    };

    return NextResponse.json({
      summary,
      notReady: checks.filter((x) => !x.ready).slice(0, 80),
    });
  } catch (err) {
    console.error("[Products checklist] GET failed:", err);
    return NextResponse.json({ error: "Failed to build checklist" }, { status: 500 });
  }
}


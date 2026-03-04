import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig, CATALOG_DEFAULTS } from "@/lib/catalogConfig";
import { requirePermission } from "@/lib/admin-auth";

const MERGE_EDGES = [
  { from: "stickers", to: "stickers-labels-decals" },
  { from: "stickers-labels", to: "stickers-labels-decals" },
  { from: "signs", to: "signs-rigid-boards" },
  { from: "signs-boards", to: "signs-rigid-boards" },
  { from: "rigid-signs", to: "signs-rigid-boards" },
  { from: "banners", to: "banners-displays" },
  { from: "marketing", to: "marketing-business-print" },
  { from: "marketing-prints", to: "marketing-business-print" },
  { from: "displays", to: "banners-displays" },
  { from: "window-graphics", to: "windows-walls-floors" },
  { from: "large-format-graphics", to: "windows-walls-floors" },
  { from: "fleet-compliance-id", to: "vehicle-graphics-fleet" },
  { from: "vehicle-branding-advertising", to: "vehicle-graphics-fleet" },
  { from: "safety-warning-decals", to: "stickers-labels-decals" },
  { from: "facility-asset-labels", to: "stickers-labels-decals" },
];

export async function GET(request) {
  const auth = await requirePermission(request, "catalog", "view");
  if (!auth.authenticated) return auth.response;

  const [catGroups, products, totalCount, activeCount, catalogConfig] = await Promise.all([
    prisma.product.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        basePrice: true,
        pricingUnit: true,
        category: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    getCatalogConfig(),
  ]);

  // Build per-category buckets
  const buckets = new Map();
  for (const p of products) {
    if (!buckets.has(p.category)) buckets.set(p.category, []);
    buckets.get(p.category).push(p);
  }

  const categories = catGroups.map((g) => {
    const items = buckets.get(g.category) || [];
    return {
      name: g.category,
      count: g._count.id,
      activeCount: items.filter((p) => p.isActive).length,
      products: items,
    };
  });

  return NextResponse.json({
    categories,
    mergeEdges: MERGE_EDGES,
    totals: {
      total: totalCount,
      active: activeCount,
      inactive: totalCount - activeCount,
      categories: catGroups.length,
    },
    catalogConfig,
  });
}

export async function PUT(request) {
  const auth = await requirePermission(request, "catalog", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // Validate and merge with defaults to prevent broken config
    const config = {
      homepageCategories: Array.isArray(body.homepageCategories) ? body.homepageCategories : CATALOG_DEFAULTS.homepageCategories,
      maxPerCategory: typeof body.maxPerCategory === "number" ? body.maxPerCategory : CATALOG_DEFAULTS.maxPerCategory,
      hiddenCategories: Array.isArray(body.hiddenCategories) ? body.hiddenCategories : CATALOG_DEFAULTS.hiddenCategories,
      categoryMeta: body.categoryMeta && typeof body.categoryMeta === "object" ? body.categoryMeta : CATALOG_DEFAULTS.categoryMeta,
    };

    await prisma.setting.upsert({
      where: { key: "catalog.config" },
      create: { key: "catalog.config", value: config },
      update: { value: config },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/shop", "layout");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Catalog] PUT error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

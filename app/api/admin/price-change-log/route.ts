import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

/**
 * GET /api/admin/price-change-log
 * List price change log entries (most recent first).
 * Query params: page, limit, productSlug, scope
 */
export async function GET(req: Request) {
  const session = await getAdminSession(req);
  if (!session.authenticated) {
    return session.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 30));
  const productSlug = url.searchParams.get("productSlug") || undefined;
  const scope = url.searchParams.get("scope") || undefined;

  const where: Record<string, unknown> = {};
  if (productSlug) where.productSlug = productSlug;
  if (scope) where.scope = scope;

  try {
    const [logs, total] = await Promise.all([
      prisma.priceChangeLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.priceChangeLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/price-change-log
 * Create a new change log entry (when an admin edits pricing).
 */
export async function POST(req: Request) {
  const session = await getAdminSession(req);
  if (!session.authenticated) {
    return session.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = session.user;

  try {
    const body = await req.json();
    const {
      productId, productSlug, productName,
      scope, field, labelBefore, labelAfter,
      valueBefore, valueAfter, driftPct,
      affectedCount, note,
    } = body;

    if (!productSlug || !field) {
      return NextResponse.json({ error: "productSlug and field are required" }, { status: 400 });
    }

    const log = await prisma.priceChangeLog.create({
      data: {
        productId: productId || null,
        productSlug,
        productName: productName || "",
        scope: scope || "product",
        field,
        labelBefore: labelBefore || "",
        labelAfter: labelAfter || "",
        valueBefore: valueBefore ?? null,
        valueAfter: valueAfter ?? null,
        driftPct: driftPct ? Number(driftPct) : null,
        affectedCount: affectedCount ? Number(affectedCount) : null,
        operatorId: admin.id,
        operatorName: admin.name || admin.email,
        note: note || null,
      },
    });

    return NextResponse.json({ log });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

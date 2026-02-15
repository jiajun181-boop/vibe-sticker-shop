import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "dashboard", "view");
  if (!auth.authenticated) return auth.response;

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { customerEmail: { contains: q, mode: "insensitive" } },
          { id: { startsWith: q } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, customerEmail: true, status: true },
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const results = [
    ...orders.map((o) => ({
      type: "order" as const,
      label: `${o.customerEmail} (${o.id.slice(0, 8)}…)`,
      href: `/admin/orders/${o.id}`,
    })),
    ...products.map((p) => ({
      type: "product" as const,
      label: p.name,
      href: `/admin/products/${p.id}`,
    })),
  ];

  return NextResponse.json({ results });
}

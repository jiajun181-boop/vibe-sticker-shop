import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { buildProductionManifest, manifestToJson, manifestToText } from "@/lib/production-manifest";

/**
 * GET /api/admin/orders/[id]/manifest
 *
 * Returns a production manifest for the order.
 * Query params:
 *   format=json (default) — structured JSON manifest
 *   format=text — human-readable plain text
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") || "json";

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productionJob: {
              select: { id: true, status: true },
            },
          },
        },
        files: true,
        proofData: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const manifest = buildProductionManifest(order);
    if (!manifest) {
      return NextResponse.json({ error: "Unable to build manifest" }, { status: 422 });
    }

    if (format === "text") {
      const text = manifestToText(manifest);
      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="manifest-${id.slice(0, 8)}.txt"`,
        },
      });
    }

    // JSON (default)
    return NextResponse.json(manifest);
  } catch (err) {
    console.error("[Manifest] Error:", err);
    return NextResponse.json({ error: "Failed to build manifest" }, { status: 500 });
  }
}

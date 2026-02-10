import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const format = searchParams.get("format") || "json";
    const category = searchParams.get("category");
    const active = searchParams.get("active");

    // Build filter
    const where: Record<string, unknown> = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (active === "true") where.isActive = true;
    else if (active === "false") where.isActive = false;

    // Fetch all matching products (no pagination)
    const products = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Log the export activity
    await logActivity({
      action: "export",
      entity: "product",
      details: {
        format,
        count: products.length,
        filters: { category, active },
      },
    });

    if (format === "csv") {
      // Build CSV manually
      const headers = [
        "id",
        "name",
        "slug",
        "category",
        "type",
        "basePrice",
        "pricingUnit",
        "isActive",
        "description",
      ];

      const csvRows: string[] = [headers.join(",")];

      for (const product of products) {
        const row = [
          JSON.stringify(product.id),
          JSON.stringify(product.name),
          JSON.stringify(product.slug),
          JSON.stringify(product.category),
          JSON.stringify(product.type),
          JSON.stringify(product.basePrice),
          JSON.stringify(product.pricingUnit),
          JSON.stringify(product.isActive),
          JSON.stringify(product.description ?? ""),
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="products-export-${timestamp}.csv"`,
        },
      });
    }

    // Default: JSON format
    const jsonContent = JSON.stringify(products, null, 2);

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="products-export-${timestamp}.json"`,
      },
    });
  } catch (error) {
    console.error("[Products Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export products" },
      { status: 500 }
    );
  }
}

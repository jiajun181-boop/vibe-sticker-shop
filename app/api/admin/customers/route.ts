import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

interface CustomerRow {
  email: string;
  name: string | null;
  ordercount: number;
  totalspent: number;
  firstorder: Date;
  lastorder: Date;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "customers", "view");
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "totalSpent";
  const order = searchParams.get("order") || "desc";
  const offset = (page - 1) * limit;

  try {
    // Build WHERE clause for search
    const whereClauses: Prisma.Sql[] = [];
    if (search) {
      whereClauses.push(
        Prisma.sql`("customerEmail" ILIKE ${"%" + search + "%"} OR "customerName" ILIKE ${"%" + search + "%"})`
      );
    }

    const whereSQL =
      whereClauses.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereClauses, " AND ")}`
        : Prisma.sql``;

    // Build ORDER BY clause
    const sortColumnMap: Record<string, string> = {
      totalSpent: "totalspent",
      orderCount: "ordercount",
      email: "email",
      lastOrder: "lastorder",
      firstOrder: "firstorder",
    };
    const sortCol = sortColumnMap[sort] || "totalspent";
    const orderDir = order === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

    // Get paginated customer aggregates
    const customers = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          "customerEmail" AS email,
          MAX("customerName") AS name,
          COUNT(*)::int AS ordercount,
          SUM("totalAmount")::int AS totalspent,
          MIN("createdAt") AS firstorder,
          MAX("createdAt") AS lastorder
        FROM "Order"
        ${whereSQL}
        GROUP BY "customerEmail"
        ORDER BY ${Prisma.raw(sortCol)} ${orderDir}
        LIMIT ${limit} OFFSET ${offset}
      `
    )) as CustomerRow[];

    // Get total unique customer count
    const countResult = (await prisma.$queryRaw(
      Prisma.sql`
        SELECT COUNT(DISTINCT "customerEmail")::int AS count
        FROM "Order"
        ${whereSQL}
      `
    )) as [{ count: number }];

    const total = countResult[0]?.count || 0;

    // Normalize field names to camelCase for frontend
    const normalized = customers.map((c) => ({
      email: c.email,
      name: c.name,
      orderCount: c.ordercount,
      totalSpent: c.totalspent,
      firstOrder: c.firstorder,
      lastOrder: c.lastorder,
    }));

    return NextResponse.json({
      customers: normalized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

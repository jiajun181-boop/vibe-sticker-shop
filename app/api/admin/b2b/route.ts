import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requirePermission(request as any, "b2b", "view");
  if (!auth.authenticated) return auth.response;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all"; // all | pending | approved
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = { accountType: "B2B" };
  if (filter === "pending") where.b2bApproved = false;
  if (filter === "approved") where.b2bApproved = true;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        companyRole: true,
        b2bApproved: true,
        b2bApprovedAt: true,
        emailVerified: true,
        partnerTier: true,
        partnerDiscount: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pageSize: limit });
}

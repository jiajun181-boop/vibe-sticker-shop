import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/orders/[id]/emails
 * Returns email log entries associated with this order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  const emails = await prisma.emailLog.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      to: true,
      subject: true,
      template: true,
      status: true,
      error: true,
      createdAt: true,
    },
  });

  return NextResponse.json(emails);
}

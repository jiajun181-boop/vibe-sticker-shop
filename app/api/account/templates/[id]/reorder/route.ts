import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const template = await prisma.orderTemplate.findFirst({
    where: { id, userId: session.userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Build cart items from template
  const cartItems = template.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    options: item.options,
  }));

  // Update template usage stats
  await prisma.orderTemplate.update({
    where: { id },
    data: {
      lastUsedAt: new Date(),
      useCount: { increment: 1 },
    },
  });

  return NextResponse.json({ cartItems });
}

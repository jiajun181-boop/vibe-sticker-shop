import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.orderTemplate.findMany({
    where: { userId: session.userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, items } = body;

  if (!name || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Name and items are required" }, { status: 400 });
  }

  const template = await prisma.orderTemplate.create({
    data: {
      userId: session.userId,
      name,
      description: description || null,
      items: {
        create: items.map((item: any, idx: number) => ({
          productId: item.productId || null,
          productName: item.productName || item.name || "Item",
          quantity: item.quantity || 1,
          options: item.options || null,
          sortOrder: idx,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ template }, { status: 201 });
}

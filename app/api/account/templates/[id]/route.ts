import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

async function getOwnedTemplate(req: NextRequest, id: string) {
  const session = getSessionFromRequest(req as any);
  if (!session?.userId) return null;

  return prisma.orderTemplate.findFirst({
    where: { id, userId: session.userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await getOwnedTemplate(req, id);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ template });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await getOwnedTemplate(req, id);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.description !== undefined) data.description = body.description || null;

  const updated = await prisma.orderTemplate.update({
    where: { id },
    data,
    include: { items: true },
  });

  return NextResponse.json({ template: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await getOwnedTemplate(req, id);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.orderTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

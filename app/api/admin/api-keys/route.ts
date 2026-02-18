import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { generateApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "customers", "view");
  if (!auth.authenticated) return auth.response;

  const keys = await prisma.apiKey.findMany({
    include: { user: { select: { email: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      user: k.user,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, "customers", "edit");
  if (!auth.authenticated) return auth.response;

  const body = await req.json();
  const { userId, name } = body;

  if (!userId || !name) {
    return NextResponse.json({ error: "userId and name are required" }, { status: 400 });
  }

  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      keyPrefix,
    },
  });

  // Return raw key only on creation (never stored)
  return NextResponse.json({ key: rawKey, prefix: keyPrefix }, { status: 201 });
}

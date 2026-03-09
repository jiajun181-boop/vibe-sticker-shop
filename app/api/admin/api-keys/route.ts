import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { generateApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "b2b", "view");
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

  } catch (err) {
    console.error("[admin/api-keys] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "b2b", "edit");
    if (!auth.authenticated) return auth.response;

    const body = await req.json();
    const { userId, name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // userId is optional — if not provided, find the first B2B user or create a system key
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      // Look for an existing B2B user, or use any user
      const fallbackUser = await prisma.user.findFirst({
        where: { accountType: "B2B" },
        select: { id: true },
      });
      if (!fallbackUser) {
        return NextResponse.json(
          { error: "No B2B user found. Create a B2B account first, or pass userId." },
          { status: 400 }
        );
      }
      resolvedUserId = fallbackUser.id;
    }

    const { rawKey, keyHash, keyPrefix } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: resolvedUserId,
        name: name.trim(),
        keyHash,
        keyPrefix,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    // Return raw key only on creation (never stored)
    return NextResponse.json({ plainKey: rawKey, apiKey }, { status: 201 });

  } catch (err) {
    console.error("[admin/api-keys] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requirePermission(req, "b2b", "edit");
    if (!auth.authenticated) return auth.response;

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Soft-delete by deactivating the key
    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[admin/api-keys] DELETE error:", err);
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }
}

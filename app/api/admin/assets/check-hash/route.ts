import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";

/**
 * POST /api/admin/assets/check-hash — Check if an asset with this SHA256 already exists.
 * Body: { sha256: string }
 * Returns the existing asset if found, null otherwise.
 * Used by the frontend to check for duplicates before uploading.
 */
export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { sha256 } = body;

    if (!sha256 || typeof sha256 !== "string") {
      return NextResponse.json(
        { error: "sha256 hash is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.asset.findUnique({
      where: { sha256 },
      include: {
        _count: { select: { links: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ asset: null });
    }

    return NextResponse.json({
      asset: {
        ...existing,
        linkCount: existing._count.links,
        _count: undefined,
      },
    });
  } catch (err) {
    console.error("[CheckHash POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to check hash" },
      { status: 500 }
    );
  }
}

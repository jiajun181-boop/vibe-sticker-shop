// app/api/admin/pricing/quote-snapshots/[id]/route.ts
// Single quote snapshot detail endpoint.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/pricing/quote-snapshots/[id] — Fetch a single quote snapshot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const snapshot = await prisma.adminQuoteSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[quote-snapshot] GET by id failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch quote snapshot" },
      { status: 500 }
    );
  }
}

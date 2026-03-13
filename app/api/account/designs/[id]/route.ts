import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// DELETE /api/account/designs/[id] — delete a saved design
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const design = await prisma.savedDesign.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    if (design.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.savedDesign.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[account/designs/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 }
    );
  }
}

// PATCH /api/account/designs/[id] — update a saved design
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const design = await prisma.savedDesign.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    if (design.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.config !== undefined) updateData.config = body.config;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;

    const updated = await prisma.savedDesign.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        productSlug: true,
        thumbnailUrl: true,
        config: true,
        shareToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ design: updated });
  } catch (err) {
    console.error("[account/designs/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update design" },
      { status: 500 }
    );
  }
}

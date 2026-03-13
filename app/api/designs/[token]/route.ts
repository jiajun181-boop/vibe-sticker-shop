import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/designs/[token] — public endpoint to load a shared design by share token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || token.length < 8) {
      return NextResponse.json(
        { error: "Invalid share token" },
        { status: 400 }
      );
    }

    const design = await prisma.savedDesign.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        name: true,
        productSlug: true,
        thumbnailUrl: true,
        config: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!design) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }

    // Return design info without exposing internal IDs or full user data
    return NextResponse.json({
      design: {
        name: design.name,
        productSlug: design.productSlug,
        thumbnailUrl: design.thumbnailUrl,
        config: design.config,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt,
        authorName: design.user?.name || "Anonymous",
      },
    });
  } catch (err) {
    console.error("[designs/[token]] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load shared design" },
      { status: 500 }
    );
  }
}

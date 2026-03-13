import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import crypto from "crypto";

const MAX_DESIGNS_PER_USER = 50;
const MAX_NAME_LENGTH = 120;

// GET /api/account/designs — list saved designs for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const designs = await prisma.savedDesign.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
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

    return NextResponse.json({ designs });
  } catch (err) {
    console.error("[account/designs] GET error:", err);
    return NextResponse.json(
      { error: "Failed to load designs" },
      { status: 500 }
    );
  }
}

// POST /api/account/designs — save a new design configuration
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, productSlug, config, thumbnailUrl } = body;

    // ── Validation ──
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
    if (
      !productSlug ||
      typeof productSlug !== "string" ||
      productSlug.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }
    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { error: "Config object is required" },
        { status: 400 }
      );
    }
    if (
      thumbnailUrl !== undefined &&
      thumbnailUrl !== null &&
      typeof thumbnailUrl !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid thumbnail URL" },
        { status: 400 }
      );
    }

    // ── Limit check ──
    const existingCount = await prisma.savedDesign.count({
      where: { userId: user.id },
    });
    if (existingCount >= MAX_DESIGNS_PER_USER) {
      return NextResponse.json(
        {
          error: `You can save up to ${MAX_DESIGNS_PER_USER} designs. Please delete an existing design first.`,
        },
        { status: 400 }
      );
    }

    // ── Generate unique share token ──
    const shareToken = crypto.randomBytes(16).toString("hex");

    // ── Create ──
    const design = await prisma.savedDesign.create({
      data: {
        userId: user.id,
        name: name.trim(),
        productSlug: productSlug.trim(),
        config,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        shareToken,
      },
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

    return NextResponse.json({ design }, { status: 201 });
  } catch (err) {
    console.error("[account/designs] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save design" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  extractImageMeta,
  validateUpload,
  computeSha256,
} from "@/lib/asset-utils";

/**
 * GET /api/admin/assets — Paginated asset list with search/filter.
 */
export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "40");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const tag = searchParams.get("tag") || "";

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { altText: { contains: search, mode: "insensitive" } },
        { originalName: { contains: search, mode: "insensitive" } },
        { caption: { contains: search, mode: "insensitive" } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          _count: { select: { links: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      assets: assets.map((a) => ({
        ...a,
        linkCount: a._count.links,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[Assets GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/assets — Upload a new asset.
 * Accepts multipart form data with a file + optional metadata fields.
 * Performs SHA256 dedup — returns existing asset if hash matches.
 */
export async function POST(request: NextRequest) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) || null;
    const altTextZh = (formData.get("altTextZh") as string) || null;
    const caption = (formData.get("caption") as string) || null;
    const tagsRaw = (formData.get("tags") as string) || "";
    const focalX = parseFloat((formData.get("focalX") as string) || "0.5");
    const focalY = parseFloat((formData.get("focalY") as string) || "0.5");

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const originalName = file.name || "unknown";

    // Validate upload
    const validationError = validateUpload(buffer, mimeType, originalName);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Compute SHA256 for dedup
    const sha256 = await computeSha256(buffer);

    // Check for existing asset with same hash
    const existing = await prisma.asset.findUnique({
      where: { sha256 },
      include: { _count: { select: { links: true } } },
    });

    if (existing) {
      return NextResponse.json({
        asset: { ...existing, linkCount: existing._count.links, _count: undefined },
        deduplicated: true,
      });
    }

    // Extract image metadata
    const meta = extractImageMeta(buffer, mimeType);
    const widthPx = meta?.widthPx ?? 600;
    const heightPx = meta?.heightPx ?? 600;
    const hasAlpha = meta?.hasAlpha ?? false;

    // Parse tags
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Upload to UploadThing via server-side API
    const uploadUrl = await uploadToUploadThing(buffer, originalName, mimeType);

    // Create asset record
    const asset = await prisma.asset.create({
      data: {
        sha256,
        originalName,
        originalUrl: uploadUrl,
        mimeType,
        sizeBytes: buffer.length,
        widthPx,
        heightPx,
        hasAlpha,
        focalX: isNaN(focalX) ? 0.5 : focalX,
        focalY: isNaN(focalY) ? 0.5 : focalY,
        altText,
        altTextZh,
        caption,
        tags,
        status: "published",
        uploadedBy: "admin",
        publishedAt: new Date(),
      },
    });

    await logActivity({
      action: "create",
      entity: "Asset",
      entityId: asset.id,
      details: {
        originalName,
        mimeType,
        sizeBytes: buffer.length,
        widthPx,
        heightPx,
        sha256: sha256.slice(0, 12) + "...",
      },
    });

    return NextResponse.json(
      { asset, deduplicated: false },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Assets POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}

/**
 * Upload file to UploadThing via their server-side upload API.
 * Falls back to a data URL for local dev if UploadThing isn't configured.
 */
async function uploadToUploadThing(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.UPLOADTHING_TOKEN;

  if (!apiKey) {
    // Dev fallback: store as local file reference
    console.warn("[Assets] No UPLOADTHING_TOKEN — using placeholder URL");
    return `/api/placeholder/${fileName}`;
  }

  // Use UploadThing's server-side presigned upload flow
  const { UTApi } = await import("uploadthing/server");
  const utapi = new UTApi();

  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  const utFile = new File([arrayBuffer], fileName, { type: mimeType });

  const response = await utapi.uploadFiles(utFile);

  if (response.error) {
    throw new Error(`UploadThing error: ${response.error.message}`);
  }

  return response.data.ufsUrl || response.data.url;
}

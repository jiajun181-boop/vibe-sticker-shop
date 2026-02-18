import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";
import {
  extractImageMeta,
  validateUpload,
  computeSha256,
} from "@/lib/asset-utils";

// Allow longer execution time on Vercel for large uploads
export const maxDuration = 30;

/**
 * GET /api/admin/assets — Paginated asset list with search/filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "media", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "40")));
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
  const auth = await requirePermission(request, "media", "edit");
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
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Assets POST] Error:", message, err);
    const publicError = process.env.NODE_ENV === "production"
      ? "Failed to upload asset"
      : `Failed to upload asset: ${message}`;
    return NextResponse.json(
      { error: publicError },
      { status: 500 }
    );
  }
}

/**
 * Upload file to UploadThing via their server-side upload API.
 */
async function uploadToUploadThing(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const token = normalizeUploadThingToken(process.env.UPLOADTHING_TOKEN);

  const { UTApi, UTFile } = await import("uploadthing/server");
  const utapi = new UTApi({ token });

  const utFile = new UTFile([new Uint8Array(buffer)], fileName, {
    type: mimeType,
  });

  let response;
  try {
    response = await utapi.uploadFiles(utFile);
  } catch (uploadErr) {
    const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
    const cause = uploadErr instanceof Error && uploadErr.cause
      ? JSON.stringify(uploadErr.cause, null, 2)
      : "none";
    console.error("[UploadThing] uploadFiles threw:", msg, "cause:", cause);
    throw new Error(`UploadThing upload threw: ${msg} | cause: ${cause}`);
  }

  if (response.error) {
    const errDetail = JSON.stringify(response.error, null, 2);
    console.error("[UploadThing] Upload failed:", errDetail);
    throw new Error(
      `UploadThing error: ${response.error.message} (code: ${response.error.code || "unknown"}) detail: ${errDetail}`
    );
  }

  return response.data.ufsUrl || response.data.url;
}

function normalizeUploadThingToken(raw: string | undefined): string {
  if (!raw) {
    throw new Error("UPLOADTHING_TOKEN is missing. Configure it in deployment env.");
  }

  let token = raw.trim();

  if (token.toUpperCase().startsWith("UPLOADTHING_TOKEN=")) {
    token = token.slice("UPLOADTHING_TOKEN=".length).trim();
  }

  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }

  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64").toString("utf8");
  } catch {
    throw new Error("UPLOADTHING_TOKEN is not valid base64.");
  }

  try {
    const parsed = JSON.parse(decoded) as { apiKey?: string; appId?: string; regions?: string[] };
    if (!parsed?.apiKey || !parsed?.appId || !Array.isArray(parsed?.regions)) {
      throw new Error("missing fields");
    }
  } catch {
    throw new Error("UPLOADTHING_TOKEN is invalid. Use the Quick Copy token value (starts with eyJ...), not sk_live.");
  }

  return token;
}


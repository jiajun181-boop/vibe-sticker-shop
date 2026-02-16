import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { slugify, validateSlug } from "@/lib/slugify";

const SUBSERIES_TAG_PREFIX = "subseries:";

function getSubseriesTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === "string" && t.startsWith(SUBSERIES_TAG_PREFIX))
    .map((t) => t.slice(SUBSERIES_TAG_PREFIX.length))
    .filter(Boolean);
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const values = tags
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "name",
    "slug",
    "category",
    "type",
    "description",
    "basePrice",
    "pricingUnit",
    "isActive",
    "sortOrder",
    "minWidthIn",
    "minHeightIn",
    "maxWidthIn",
    "maxHeightIn",
    "minDpi",
    "requiresBleed",
    "bleedIn",
    "templateUrl",
    "pricingConfig",
    "optionsConfig",
    "tags",
    "isFeatured",
    "acceptedFormats",
    "keywords",
    "metaTitle",
    "metaDescription",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (!data.name && !data.slug && Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { tags: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Validate slug if being updated
  if (data.slug) {
    data.slug = slugify(data.slug as string);
    const slugError = validateSlug(data.slug as string);
    if (slugError) {
      return NextResponse.json({ error: slugError }, { status: 400 });
    }
    // Check uniqueness (excluding current product)
    const existing = await prisma.product.findFirst({
      where: { slug: data.slug as string, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: `Slug "${data.slug}" is already taken` }, { status: 409 });
    }
  }

  const finalTags = normalizeTags((data.tags as unknown) ?? existing.tags ?? []);
  if (data.tags !== undefined) {
    data.tags = finalTags;
  }
  const subseriesTags = getSubseriesTags(finalTags);
  if (subseriesTags.length > 20) {
    return NextResponse.json(
      {
        error: "A product cannot have more than 20 subseries tags.",
      },
      { status: 400 }
    );
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  // Soft-delete: deactivate instead of hard delete to preserve order references
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, deactivated: true, id: product.id });
}

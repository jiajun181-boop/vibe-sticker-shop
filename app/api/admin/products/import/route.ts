import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requirePermission } from "@/lib/admin-auth";

const VALID_CATEGORIES = [
  "fleet-compliance-id",
  "vehicle-branding-advertising",
  "safety-warning-decals",
  "facility-asset-labels",
];

const VALID_TYPES = ["sticker", "label", "sign", "other"];

const VALID_PRICING_UNITS = ["per_piece", "per_sqft"];

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ProductInput {
  name?: string;
  slug?: string;
  basePrice?: number;
  category?: string;
  pricingUnit?: string;
  type?: string;
  description?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "products", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { products } = body as { products: ProductInput[] };

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Request body must contain a non-empty 'products' array" },
        { status: 400 }
      );
    }

    if (products.length > 200) {
      return NextResponse.json(
        { error: "Import limited to 200 products at a time" },
        { status: 400 }
      );
    }

    const errors: ValidationError[] = [];

    // Step 1: Validate all rows
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const row = i + 1;

      // Required fields
      if (!product.name || typeof product.name !== "string" || product.name.trim() === "") {
        errors.push({ row, field: "name", message: "Name is required" });
      }

      if (!product.slug || typeof product.slug !== "string" || product.slug.trim() === "") {
        errors.push({ row, field: "slug", message: "Slug is required" });
      }

      if (product.basePrice === undefined || product.basePrice === null || typeof product.basePrice !== "number") {
        errors.push({ row, field: "basePrice", message: "Base price is required and must be a number (in cents)" });
      }

      if (!product.category || typeof product.category !== "string") {
        errors.push({ row, field: "category", message: "Category is required" });
      } else if (!VALID_CATEGORIES.includes(product.category)) {
        errors.push({
          row,
          field: "category",
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
      }

      if (!product.pricingUnit || typeof product.pricingUnit !== "string") {
        errors.push({ row, field: "pricingUnit", message: "Pricing unit is required" });
      } else if (!VALID_PRICING_UNITS.includes(product.pricingUnit)) {
        errors.push({
          row,
          field: "pricingUnit",
          message: `Invalid pricing unit. Must be one of: ${VALID_PRICING_UNITS.join(", ")}`,
        });
      }

      // Optional field validation
      if (product.type !== undefined && product.type !== null) {
        if (!VALID_TYPES.includes(product.type as string)) {
          errors.push({
            row,
            field: "type",
            message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
          });
        }
      }
    }

    // If there are validation errors, return them without importing
    if (errors.length > 0) {
      return NextResponse.json(
        { imported: 0, errors },
        { status: 400 }
      );
    }

    // Step 2: Check slug uniqueness against existing products
    const incomingSlugs = products.map((p) => p.slug!.trim());
    const existingSlugs = await prisma.product.findMany({
      where: { slug: { in: incomingSlugs } },
      select: { slug: true },
    });
    const existingSlugSet = new Set(existingSlugs.map((p) => p.slug));

    // Also track slugs within the import batch to avoid duplicates
    const usedSlugs = new Set<string>();
    existingSlugSet.forEach((s: string) => usedSlugs.add(s));

    const resolvedSlugs: string[] = [];
    for (const product of products) {
      let slug = product.slug!.trim();
      if (usedSlugs.has(slug)) {
        let n = 1;
        while (usedSlugs.has(`${slug}-${n}`)) {
          n++;
        }
        slug = `${slug}-${n}`;
      }
      usedSlugs.add(slug);
      resolvedSlugs.push(slug);
    }

    // Step 3: Use transaction to insert all products atomically
    const created = await prisma.$transaction(
      products.map((product, i) =>
        prisma.product.create({
          data: {
            name: product.name!.trim(),
            slug: resolvedSlugs[i],
            basePrice: product.basePrice!,
            category: product.category!,
            pricingUnit: product.pricingUnit as "per_piece" | "per_sqft",
            type: (product.type as "sticker" | "label" | "sign" | "other") ?? "sticker",
            description: product.description ?? null,
            isActive: product.isActive ?? true,
          },
        })
      )
    );

    // Step 4: Log activity
    await logActivity({
      action: "import",
      entity: "product",
      details: {
        count: created.length,
        slugs: resolvedSlugs,
      },
    });

    return NextResponse.json(
      { imported: created.length, errors: [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Products Import] Error:", error);
    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    );
  }
}

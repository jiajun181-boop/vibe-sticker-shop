import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminAuth(request);
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
  const auth = requireAdminAuth(request);
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
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  const orderItems = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItems > 0) {
    return NextResponse.json(
      { error: "Cannot delete a product with existing orders. Deactivate it instead." },
      { status: 409 }
    );
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

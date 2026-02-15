"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { slugify, validateSlug } from "@/lib/slugify";

export async function createProduct(formData) {
  const name = formData.get("name");
  let slug = formData.get("slug");
  const category = formData.get("category") || "fleet-compliance-id";
  const type = formData.get("type") || "sticker";
  const description = formData.get("description") || null;
  const basePrice = Math.round(parseFloat(formData.get("basePrice")) * 100);
  const pricingUnit = formData.get("pricingUnit") || "per_piece";
  const imageUrl = formData.get("imageUrl") || null;
  const subseries = (formData.get("subseries") || "").toString().trim();

  if (!name || isNaN(basePrice) || basePrice < 0 || !subseries) {
    return { error: "Name, subseries, and a valid base price are required." };
  }

  // Auto-generate slug from name if not provided, then validate
  slug = slug ? slugify(slug) : slugify(name);
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError };

  // Check uniqueness
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) return { error: `Slug "${slug}" is already taken.` };

  await prisma.product.create({
    data: {
      name, slug, category, type, description, basePrice, pricingUnit,
      tags: [`subseries:${subseries}`],
      ...(imageUrl ? { images: { create: [{ url: imageUrl, alt: name }] } } : {}),
    },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(formData) {
  const id = formData.get("id");
  const name = formData.get("name");
  let slug = formData.get("slug");
  const category = formData.get("category") || "fleet-compliance-id";
  const type = formData.get("type") || "sticker";
  const description = formData.get("description") || null;
  const basePrice = Math.round(parseFloat(formData.get("basePrice")) * 100);
  const pricingUnit = formData.get("pricingUnit") || "per_piece";
  const subseries = (formData.get("subseries") || "").toString().trim();

  if (!id || !name || !slug || isNaN(basePrice) || basePrice < 0 || !subseries) {
    return { error: "ID, name, slug, subseries, and a valid base price are required." };
  }

  // Sanitize and validate slug
  slug = slugify(slug);
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError };

  // Check slug uniqueness (excluding current product)
  const existing = await prisma.product.findFirst({ where: { slug, NOT: { id } } });
  if (existing) return { error: `Slug "${slug}" is already taken by another product.` };

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      category,
      type,
      description,
      basePrice,
      pricingUnit,
      tags: [`subseries:${subseries}`],
    },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductStatus(id) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { error: "Product not found." };

  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(id) {
  const orderItems = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItems > 0) {
    return { error: "Cannot delete a product that has existing orders. Deactivate it instead." };
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  return { success: true };
}

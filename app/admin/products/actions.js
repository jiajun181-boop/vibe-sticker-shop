"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData) {
  const name = formData.get("name");
  const slug = formData.get("slug");
  const category = formData.get("category") || "fleet-compliance-id";
  const type = formData.get("type") || "sticker";
  const description = formData.get("description") || null;
  const basePrice = Math.round(parseFloat(formData.get("basePrice")) * 100);
  const pricingUnit = formData.get("pricingUnit") || "per_piece";
  const imageUrl = formData.get("imageUrl") || null;

  if (!name || !slug || isNaN(basePrice) || basePrice < 0) {
    return { error: "Name, slug, and a valid base price are required." };
  }

  await prisma.product.create({
    data: {
      name, slug, category, type, description, basePrice, pricingUnit,
      ...(imageUrl ? { images: { create: [{ url: imageUrl, alt: name }] } } : {}),
    },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(formData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const slug = formData.get("slug");
  const category = formData.get("category") || "fleet-compliance-id";
  const type = formData.get("type") || "sticker";
  const description = formData.get("description") || null;
  const basePrice = Math.round(parseFloat(formData.get("basePrice")) * 100);
  const pricingUnit = formData.get("pricingUnit") || "per_piece";

  if (!id || !name || !slug || isNaN(basePrice) || basePrice < 0) {
    return { error: "ID, name, slug, and a valid base price are required." };
  }

  await prisma.product.update({
    where: { id },
    data: { name, slug, category, type, description, basePrice, pricingUnit },
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

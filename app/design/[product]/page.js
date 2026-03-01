"use client";

import { useParams, useSearchParams } from "next/navigation";
import { DesignStudio } from "@/components/design-studio";
import { getProductSpec } from "@/lib/design-studio/product-configs";

export default function DesignPage() {
  const { product } = useParams();
  const searchParams = useSearchParams();

  const slug = product || "business-cards";

  // Parse URL params for custom dimensions / cart context
  const overrides = {
    width: searchParams.get("width"),
    height: searchParams.get("height"),
    sides: searchParams.get("sides"),
  };

  const productSpec = getProductSpec(slug, overrides);

  // Build cart item context from URL params
  const cartItemContext = {
    id: slug,
    slug,
    name: searchParams.get("name") || productSpec?.label || slug,
    price: parseInt(searchParams.get("price") || "0", 10), // cents
    qty: parseInt(searchParams.get("qty") || "1", 10),
    options: {
      widthIn: productSpec?.widthIn,
      heightIn: productSpec?.heightIn,
    },
  };

  if (!productSpec) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">
            Product Not Found
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            The product "{slug}" is not available for online design.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DesignStudio
      productSlug={slug}
      productSpec={productSpec}
      cartItemContext={cartItemContext}
    />
  );
}

"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DesignStudio } from "@/components/design-studio";
import { getProductSpec } from "@/lib/design-studio/product-configs";

export default function DesignPage() {
  const { product } = useParams();
  const searchParams = useSearchParams();

  const slug = product || "business-cards";

  // Memoize productSpec to prevent infinite re-render loops
  const widthParam = searchParams.get("width");
  const heightParam = searchParams.get("height");
  const sidesParam = searchParams.get("sides");

  const productSpec = useMemo(() => {
    return getProductSpec(slug, {
      width: widthParam,
      height: heightParam,
      sides: sidesParam,
    });
  }, [slug, widthParam, heightParam, sidesParam]);

  // Memoize cart context
  const nameParam = searchParams.get("name");
  const priceParam = searchParams.get("price");
  const qtyParam = searchParams.get("qty");

  const cartItemContext = useMemo(() => ({
    id: slug,
    slug,
    name: nameParam || productSpec?.label || slug,
    price: parseInt(priceParam || "0", 10),
    qty: parseInt(qtyParam || "1", 10),
    options: {
      widthIn: productSpec?.widthIn,
      heightIn: productSpec?.heightIn,
    },
  }), [slug, nameParam, priceParam, qtyParam, productSpec]);

  if (!productSpec) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">
            Product Not Found
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            The product &ldquo;{slug}&rdquo; is not available for online design.
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

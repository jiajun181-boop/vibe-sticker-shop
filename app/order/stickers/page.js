import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import StickerOrderClient from "./StickerOrderClient";

export function generateMetadata() {
  return {
    title: "Stickers & Labels - Build Your Order | La Lunar Printing",
    description:
      "Order die-cut, kiss-cut, sheet, and roll stickers and labels online. Choose size, material, and quantity with instant pricing.",
    openGraph: {
      title: "Stickers & Labels - Build Your Order",
      description:
        "Configure and order stickers and labels in one step: die-cut, kiss-cut, sheets, rolls, and vinyl lettering.",
      url: "/order/stickers",
    },
  };
}

export default async function StickerOrderPage() {
  const productImages = await getOrderPageImages(["stickers","die-cut-singles","die-cut-stickers"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <StickerOrderClient productImages={productImages} />
    </Suspense>
  );
}

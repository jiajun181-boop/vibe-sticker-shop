import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import DieCutStickerOrderClient from "./DieCutStickerOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Die-Cut Stickers — Order Online",
    description:
      "Order custom die-cut stickers online. Cut to any shape with premium vinyl materials and lamination options.",
    openGraph: {
      title: "Custom Die-Cut Stickers — Order Online",
      description:
        "Configure and order custom die-cut stickers. Choose shape, size, material, and finish.",
      url: "/order/die-cut-stickers",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/die-cut-stickers" },
  };
}

export default async function DieCutStickerOrderPage() {
  const productImages = await getOrderPageImages(["die-cut-stickers", "die-cut", "stickers"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <DieCutStickerOrderClient productImages={productImages} />
    </Suspense>
  );
}

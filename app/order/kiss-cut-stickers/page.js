import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import KissCutStickerOrderClient from "./KissCutStickerOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Kiss-Cut Stickers — Order Online",
    description:
      "Order custom kiss-cut stickers online. Easy-peel stickers with premium vinyl materials and lamination options.",
    openGraph: {
      title: "Custom Kiss-Cut Stickers — Order Online",
      description:
        "Configure and order custom kiss-cut stickers. Choose size, material, and finish.",
      url: "/order/kiss-cut-stickers",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/kiss-cut-stickers" },
  };
}

export default async function KissCutStickerOrderPage() {
  const productImages = await getOrderPageImages(["kiss-cut-stickers", "kiss-cut", "stickers"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <KissCutStickerOrderClient productImages={productImages} />
    </Suspense>
  );
}

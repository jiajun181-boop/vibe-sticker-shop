import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import RetractableStandOrderClient from "./RetractableStandOrderClient";

export function generateMetadata() {
  return {
    title: "Retractable Banner Stands — Order Online | Vibe Sticker Shop",
    description: "Order custom retractable roll-up banner stands for trade shows and events.",
    openGraph: { title: "Retractable Banner Stands — Order Online", url: "/order/retractable-stands" },
  };
}

export default async function RetractableStandOrderPage() {
  const productImages = await getOrderPageImages(["retractable-stands","retractable-banner-stand"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <RetractableStandOrderClient productImages={productImages} />
    </Suspense>
  );
}

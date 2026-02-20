import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import AluminumSignOrderClient from "./AluminumSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Aluminum Signs — Order Online | Vibe Sticker Shop",
    description: "Order custom aluminum signs for outdoor, parking, and property signage.",
    openGraph: { title: "Custom Aluminum Signs — Order Online", description: "Configure and order custom aluminum signs. Choose thickness, size, and print options.", url: "/order/aluminum-signs" },
  };
}

export default async function AluminumSignOrderPage() {
  const productImages = await getOrderPageImages(["aluminum-signs","aluminum-sign"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <AluminumSignOrderClient productImages={productImages} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import FoamBoardOrderClient from "./FoamBoardOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Foam Board Signs — Order Online | La Lunar Printing",
    description: "Order custom foam board signs for displays, presentations, and indoor signage.",
    openGraph: { title: "Custom Foam Board Signs — Order Online", description: "Configure and order custom foam board signs. Choose thickness, size, and print options.", url: "/order/foam-board-signs" },
  };
}

export default async function FoamBoardOrderPage() {
  const productImages = await getOrderPageImages(["foam-board-signs","foam-board-sign"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <FoamBoardOrderClient productImages={productImages} />
    </Suspense>
  );
}

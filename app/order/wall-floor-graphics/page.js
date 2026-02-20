import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import WallFloorGraphicOrderClient from "./WallFloorGraphicOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Wall & Floor Graphics — Order Online | Vibe Sticker Shop",
    description: "Order custom wall graphics, wall murals, and floor graphics for branding and wayfinding.",
    openGraph: { title: "Custom Wall & Floor Graphics — Order Online", url: "/order/wall-floor-graphics" },
  };
}

export default async function WallFloorGraphicOrderPage() {
  const productImages = await getOrderPageImages(["wall-floor-graphics","wall-graphics","floor-graphics"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <WallFloorGraphicOrderClient productImages={productImages} />
    </Suspense>
  );
}

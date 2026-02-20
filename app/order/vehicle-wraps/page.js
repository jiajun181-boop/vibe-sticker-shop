import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import VehicleWrapOrderClient from "./VehicleWrapOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Vehicle Wraps & Graphics — Order Online | Vibe Sticker Shop",
    description: "Order custom vehicle wraps, door graphics, and fleet branding packages.",
    openGraph: { title: "Custom Vehicle Wraps — Order Online", url: "/order/vehicle-wraps" },
  };
}

export default async function VehicleWrapOrderPage() {
  const productImages = await getOrderPageImages(["vehicle-wraps","vehicle-wrap"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <VehicleWrapOrderClient productImages={productImages} />
    </Suspense>
  );
}

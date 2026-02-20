import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import VehicleDecalOrderClient from "./VehicleDecalOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Vehicle Decals & Lettering — Order Online | Vibe Sticker Shop",
    description: "Order custom vehicle decals, lettering, DOT numbers, and compliance labels.",
    openGraph: { title: "Custom Vehicle Decals — Order Online", url: "/order/vehicle-decals" },
  };
}

export default async function VehicleDecalOrderPage() {
  const productImages = await getOrderPageImages(["vehicle-decals","vehicle-decal"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <VehicleDecalOrderClient productImages={productImages} />
    </Suspense>
  );
}

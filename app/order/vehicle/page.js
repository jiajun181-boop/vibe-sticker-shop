import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import VehicleOrderClient from "./VehicleOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Vehicle Graphics — Order Online",
    description:
      "Order custom vehicle graphics online. Vehicle wraps, door graphics, decals, magnetic signs, and fleet branding solutions.",
    openGraph: {
      title: "Custom Vehicle Graphics — Order Online",
      description:
        "Configure and order custom vehicle graphics. Choose vehicle type, coverage, and materials.",
      url: "/order/vehicle",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/vehicle" },
  };
}

export default async function VehicleOrderPage() {
  const productImages = await getOrderPageImages(["vehicle", "vehicle-wrap", "vehicle-decals"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <VehicleOrderClient productImages={productImages} />
    </Suspense>
  );
}

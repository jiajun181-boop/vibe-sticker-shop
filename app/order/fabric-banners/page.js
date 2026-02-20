import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import FabricBannerOrderClient from "./FabricBannerOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Fabric Banners — Order Online | La Lunar Printing",
    description: "Order custom fabric banners for trade shows, events, and indoor displays.",
    openGraph: { title: "Custom Fabric Banners — Order Online", url: "/order/fabric-banners" },
  };
}

export default async function FabricBannerOrderPage() {
  const productImages = await getOrderPageImages(["fabric-banners","fabric-banner"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <FabricBannerOrderClient productImages={productImages} />
    </Suspense>
  );
}

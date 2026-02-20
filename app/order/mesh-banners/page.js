import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MeshBannerOrderClient from "./MeshBannerOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Mesh Banners — Order Online | La Lunar Printing",
    description: "Order custom mesh banners — wind-resistant for fences and outdoor use.",
    openGraph: { title: "Custom Mesh Banners — Order Online", url: "/order/mesh-banners" },
  };
}

export default async function MeshBannerOrderPage() {
  const productImages = await getOrderPageImages(["mesh-banners","mesh-banner"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MeshBannerOrderClient productImages={productImages} />
    </Suspense>
  );
}

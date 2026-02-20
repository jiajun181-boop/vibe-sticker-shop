import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import WindowFilmOrderClient from "./WindowFilmOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Window Films & Clings — Order Online | La Lunar Printing",
    description: "Order custom window films, static clings, adhesive films, one-way vision, and privacy films.",
    openGraph: { title: "Custom Window Films — Order Online", url: "/order/window-films" },
  };
}

export default async function WindowFilmOrderPage() {
  const productImages = await getOrderPageImages(["window-films","window-film","adhesive-films"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <WindowFilmOrderClient productImages={productImages} />
    </Suspense>
  );
}

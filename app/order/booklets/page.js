import { Suspense } from "react";
import BookletOrderClient from "./BookletOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Booklets — Order Online | Vibe Sticker Shop",
    description:
      "Order custom booklets online. Saddle stitch, perfect bound, and wire-o binding with premium paper options and cover lamination.",
    openGraph: {
      title: "Custom Booklets — Order Online",
      description:
        "Configure and order custom booklets. Choose binding, page count, paper stock, and cover finish.",
      url: "/order/booklets",
    },
  };
}

export default function BookletOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <BookletOrderClient />
    </Suspense>
  );
}

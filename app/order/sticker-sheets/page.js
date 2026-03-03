import { Suspense } from "react";
import StickerSheetOrderClient from "./StickerSheetOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Sticker Sheets — Kiss-Cut Sheets | Order Online",
    description:
      "Order custom sticker sheets online. Choose sticker shape, size, material, and finish. Kiss-cut or micro-perforated on Letter or Tabloid sheets.",
    openGraph: {
      title: "Custom Sticker Sheets — Order Online",
      description:
        "Configure and order custom sticker sheets. Multiple shapes, materials, and finishing options.",
      url: "/order/sticker-sheets",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/sticker-sheets" },
  };
}

export default function StickerSheetOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <StickerSheetOrderClient />
    </Suspense>
  );
}

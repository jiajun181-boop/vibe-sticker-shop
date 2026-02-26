import { Suspense } from "react";
import RollLabelsOrderClient from "./RollLabelsOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Roll Labels — BOPP, Paper, Poly | Order Online",
    description:
      "Order custom roll labels online. BOPP, paper, and poly options with matte or gloss lamination. Circles, ovals, rectangles, and custom shapes.",
    openGraph: {
      title: "Custom Roll Labels — Order Online",
      description:
        "Configure and order custom roll labels. Multiple materials, shapes, and finishing options.",
      url: "/order/roll-labels",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/roll-labels" },
  };
}

export default function RollLabelsOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <RollLabelsOrderClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import CanvasPrintOrderClient from "./CanvasPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Canvas Prints — Order Online | Vibe Sticker Shop",
    description: "Order custom canvas prints for wall art, photography, and business displays.",
    openGraph: { title: "Custom Canvas Prints — Order Online", url: "/order/canvas-prints" },
  };
}

export default function CanvasPrintOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><CanvasPrintOrderClient /></Suspense>);
}

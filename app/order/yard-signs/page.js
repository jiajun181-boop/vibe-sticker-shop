import { Suspense } from "react";
import YardSignOrderClient from "./YardSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Yard Signs — Order Online | Vibe Sticker Shop",
    description: "Order custom corrugated yard signs for real estate, events, elections, and business.",
    openGraph: { title: "Custom Yard Signs — Order Online", description: "Configure and order custom yard signs. Choose size, material, print sides, and quantity.", url: "/order/yard-signs" },
  };
}

export default function YardSignOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><YardSignOrderClient /></Suspense>);
}

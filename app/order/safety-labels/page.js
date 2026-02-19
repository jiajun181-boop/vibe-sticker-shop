import { Suspense } from "react";
import SafetyLabelOrderClient from "./SafetyLabelOrderClient";

export function generateMetadata() {
  return {
    title: "Safety & Compliance Labels — Order Online | Vibe Sticker Shop",
    description: "Order custom safety labels — fire, hazard, PPE, electrical, and chemical warning labels.",
    openGraph: { title: "Safety & Compliance Labels — Order Online", description: "Configure and order custom safety labels. Choose category, material, size, and quantity.", url: "/order/safety-labels" },
  };
}

export default function SafetyLabelOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><SafetyLabelOrderClient /></Suspense>);
}

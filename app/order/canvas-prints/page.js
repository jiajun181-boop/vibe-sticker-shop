import { redirect } from "next/navigation";

// Legacy canvas-prints page — redirect to the new /order/canvas/ configurator.
// The old CanvasPrintOrderClient is kept for reference but is no longer routed to.
export default function CanvasPrintOrderPage() {
  redirect("/order/canvas");
}

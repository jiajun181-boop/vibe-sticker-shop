import { redirect } from "next/navigation";

export default function PricingDashboardPage() {
  redirect("/admin/pricing?tab=products");
}

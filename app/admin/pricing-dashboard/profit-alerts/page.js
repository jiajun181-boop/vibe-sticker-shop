import { redirect } from "next/navigation";

export default function ProfitAlertsRedirect() {
  redirect("/admin/pricing?tab=ops&section=alerts");
}

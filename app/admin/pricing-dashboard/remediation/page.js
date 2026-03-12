import { redirect } from "next/navigation";

export default function RemediationRedirect() {
  redirect("/admin/pricing?tab=ops&section=reminders");
}

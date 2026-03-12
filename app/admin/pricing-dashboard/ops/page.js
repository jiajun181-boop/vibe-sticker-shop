import { redirect } from "next/navigation";

export default function OpsRedirect() {
  redirect("/admin/pricing?tab=ops&section=reminders");
}

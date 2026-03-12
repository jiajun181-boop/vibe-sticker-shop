import { redirect } from "next/navigation";

export default function ApprovalsRedirect() {
  redirect("/admin/pricing?tab=governance&section=approvals");
}

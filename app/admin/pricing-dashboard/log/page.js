import { redirect } from "next/navigation";

export default function LegacyLogRedirect() {
  redirect("/admin/pricing?tab=governance&section=changelog");
}

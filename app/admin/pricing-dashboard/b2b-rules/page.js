import { redirect } from "next/navigation";

export default function B2BRulesRedirect() {
  redirect("/admin/pricing?tab=governance&section=b2b");
}

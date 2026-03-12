import { redirect } from "next/navigation";

export default function ChangeLogRedirect() {
  redirect("/admin/pricing?tab=governance&section=changelog");
}

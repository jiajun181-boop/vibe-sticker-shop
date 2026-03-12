import { redirect } from "next/navigation";

export default function SnapshotsRedirect() {
  redirect("/admin/pricing?tab=governance&section=snapshots");
}

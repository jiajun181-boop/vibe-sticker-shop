import { redirect } from "next/navigation";

export default function VendorCostsRedirect() {
  redirect("/admin/pricing?tab=governance&section=vendor");
}

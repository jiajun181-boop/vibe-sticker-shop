import { redirect } from "next/navigation";
import { buildOrderCenterHref } from "@/lib/admin-centers";

export default function MissingArtworkRedirectPage() {
  redirect(buildOrderCenterHref("missing_artwork"));
}

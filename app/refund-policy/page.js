import { redirect } from "next/navigation";

export const metadata = {
  title: "Refund Policy",
  description: "Read La Lunar Printing's refund, reprint, and return policy.",
};

export default function RefundPolicyRedirectPage() {
  redirect("/returns");
}


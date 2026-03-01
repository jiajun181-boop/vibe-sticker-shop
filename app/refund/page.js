import { redirect } from "next/navigation";

export const metadata = {
  title: "Refund & Return Policy",
  description: "Refund and return policy for Lunar Print orders, including reprint guarantees and claim procedures.",
};

export default function RefundPage() {
  redirect("/returns");
}

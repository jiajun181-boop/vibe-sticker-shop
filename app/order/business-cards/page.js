import { redirect } from "next/navigation";

// Old shared configurator — redirect to the business cards category page.
// Each card type now has its own page: /order/business-cards-classic, etc.
export default function BusinessCardsOrderPage() {
  redirect("/shop/marketing-business-print/business-cards");
}

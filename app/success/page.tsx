import { redirect } from "next/navigation";
import Stripe from "stripe";
import SuccessClient from "./SuccessClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
  };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    redirect("/");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.status !== "complete" && session.payment_status !== "paid") {
      redirect("/");
    }

    const customerEmail = session.customer_details?.email || session.customer_email || "";
    const amountTotal = session.amount_total || 0;

    let lineItems: any[] = [];
    try {
      const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
      lineItems = items.data.map((item) => ({
        description: item.description || "Item",
        quantity: item.quantity || 1,
        amount_total: item.amount_total || 0,
      }));
    } catch {
      // Line items may not be available for all session types
    }

    return (
      <SuccessClient
        sessionId={sessionId}
        lineItems={lineItems}
        customerEmail={customerEmail}
        amountTotal={amountTotal}
      />
    );
  } catch (error) {
    console.error("Error retrieving session:", error);
    redirect("/");
  }
}

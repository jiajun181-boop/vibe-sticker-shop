import { redirect } from "next/navigation";
import Stripe from "stripe";
import Link from "next/link";

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
      // Handle cases where the session isn't valid or paid
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Order Incomplete
          </h1>
          <p className="mb-8">
            It looks like your payment was not successful. Please try again.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      );
    }

    const customerEmail = session.customer_details?.email || session.customer_email;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been received and is being
            processed.
          </p>

          <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Order Reference:</p>
            <p className="font-mono text-sm font-medium text-gray-800 break-all">
              {session.id}
            </p>
            {customerEmail && (
              <p className="text-sm text-gray-500 mt-2">
                A confirmation email will be sent to <strong>{customerEmail}</strong>.
              </p>
            )}
          </div>

          <Link
            href="/shop"
            className="inline-block w-full px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error retrieving session:", error);
    // If the session ID is invalid or Stripe API fails
    redirect("/");
  }
}
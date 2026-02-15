export type CheckoutUiStatus = "pending" | "paid" | "failed" | "canceled";

interface DeriveStatusInput {
  sessionStatus?: string | null;
  paymentStatus?: string | null;
  orderMarkedPaid: boolean;
}

export function deriveCheckoutUiStatus({
  sessionStatus,
  paymentStatus,
  orderMarkedPaid,
}: DeriveStatusInput): CheckoutUiStatus {
  if (orderMarkedPaid && paymentStatus === "paid") {
    return "paid";
  }

  if (sessionStatus === "expired") {
    return "canceled";
  }

  if (sessionStatus === "complete" && paymentStatus !== "paid") {
    return "failed";
  }

  return "pending";
}

import { deriveCheckoutUiStatus } from "@/lib/checkout-status";

describe("deriveCheckoutUiStatus", () => {
  it("returns paid only when stripe is paid and local order is paid", () => {
    expect(
      deriveCheckoutUiStatus({
        sessionStatus: "complete",
        paymentStatus: "paid",
        orderMarkedPaid: true,
      })
    ).toBe("paid");
  });

  it("returns pending when stripe is paid but local order is not confirmed yet", () => {
    expect(
      deriveCheckoutUiStatus({
        sessionStatus: "complete",
        paymentStatus: "paid",
        orderMarkedPaid: false,
      })
    ).toBe("pending");
  });

  it("returns canceled when session is expired", () => {
    expect(
      deriveCheckoutUiStatus({
        sessionStatus: "expired",
        paymentStatus: "unpaid",
        orderMarkedPaid: false,
      })
    ).toBe("canceled");
  });

  it("returns failed when checkout completed but payment is not paid", () => {
    expect(
      deriveCheckoutUiStatus({
        sessionStatus: "complete",
        paymentStatus: "unpaid",
        orderMarkedPaid: false,
      })
    ).toBe("failed");
  });

  it("returns pending while checkout is still open", () => {
    expect(
      deriveCheckoutUiStatus({
        sessionStatus: "open",
        paymentStatus: "unpaid",
        orderMarkedPaid: false,
      })
    ).toBe("pending");
  });
});

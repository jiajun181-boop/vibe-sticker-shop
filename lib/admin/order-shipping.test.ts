/**
 * Regression tests for order-centered shipping contract (order-shipping.js).
 *
 * Validates:
 *   S1: getOrderFulfillment — state derivation from shipments
 *   S2: getTrackingUrl — carrier URL generation
 *   S3: getCarrierLabel / getCarrierColor — display helpers
 *   S4: getShipmentStatusLabel / getShipmentStatusColor — display helpers
 *   S5: Edge cases — empty, null, multiple shipments
 */

import {
  getOrderFulfillment,
  getTrackingUrl,
  getCarrierLabel,
  getCarrierColor,
  getShipmentStatusLabel,
  getShipmentStatusColor,
  normalizeCarrierCode,
  shipmentStatusMarksOrderShipped,
  getOrderProductionStatusForShipmentStatus,
  CARRIERS,
  SHIPMENT_STATUS,
} from "@/lib/admin/order-shipping";

// ── S1: getOrderFulfillment state derivation ────────────────────────────────

describe("S1: getOrderFulfillment", () => {
  it("returns 'unfulfilled' when no shipments", () => {
    const result = getOrderFulfillment([]);
    expect(result.state).toBe("unfulfilled");
    expect(result.shipmentCount).toBe(0);
    expect(result.latestShipment).toBeNull();
    expect(result.trackingNumbers).toEqual([]);
  });

  it("returns 'unfulfilled' when shipments is null", () => {
    const result = getOrderFulfillment(null);
    expect(result.state).toBe("unfulfilled");
  });

  it("returns shipment status for single shipment", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "in_transit", carrier: "canada_post", trackingNumber: "123" },
    ]);
    expect(result.state).toBe("in_transit");
    expect(result.shipmentCount).toBe(1);
    expect(result.trackingNumbers).toHaveLength(1);
    expect(result.trackingNumbers[0].number).toBe("123");
  });

  it("surfaces exception over delivered", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "delivered", carrier: "canada_post", trackingNumber: "111" },
      { id: "s2", status: "exception", carrier: "ups", trackingNumber: "222" },
    ]);
    expect(result.state).toBe("exception");
    expect(result.latestShipment?.id).toBe("s2");
  });

  it("surfaces delivered over in_transit", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "in_transit", carrier: "canada_post", trackingNumber: "111" },
      { id: "s2", status: "delivered", carrier: "ups", trackingNumber: "222" },
    ]);
    expect(result.state).toBe("delivered");
  });

  it("collects all tracking numbers", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "delivered", carrier: "canada_post", trackingNumber: "AAA" },
      { id: "s2", status: "in_transit", carrier: "ups", trackingNumber: "BBB" },
      { id: "s3", status: "pending", carrier: "fedex", trackingNumber: null },
    ]);
    expect(result.trackingNumbers).toHaveLength(2);
    expect(result.trackingNumbers.map((t: { number: string }) => t.number)).toEqual(["AAA", "BBB"]);
  });

  it("includes tracking URL in tracking numbers", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "in_transit", carrier: "canada_post", trackingNumber: "12345" },
    ]);
    expect(result.trackingNumbers[0].url).toContain("12345");
    expect(result.trackingNumbers[0].url).toContain("canadapost");
  });

  it("handles pickup carrier (no tracking URL)", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "delivered", carrier: "pickup", trackingNumber: "PICKUP-001" },
    ]);
    expect(result.trackingNumbers[0].url).toBeNull();
  });
});

// ── S2: getTrackingUrl ──────────────────────────────────────────────────────

describe("S2: getTrackingUrl", () => {
  it("returns Canada Post tracking URL", () => {
    const url = getTrackingUrl("canada_post", "12345");
    expect(url).toContain("canadapost");
    expect(url).toContain("12345");
  });

  it("returns Purolator tracking URL", () => {
    const url = getTrackingUrl("purolator", "PIN123");
    expect(url).toContain("purolator");
    expect(url).toContain("PIN123");
  });

  it("returns UPS tracking URL", () => {
    const url = getTrackingUrl("ups", "1Z999");
    expect(url).toContain("ups.com");
    expect(url).toContain("1Z999");
  });

  it("returns FedEx tracking URL", () => {
    const url = getTrackingUrl("fedex", "FDX123");
    expect(url).toContain("fedex.com");
    expect(url).toContain("FDX123");
  });

  it("returns null for pickup carrier", () => {
    expect(getTrackingUrl("pickup", "LOC-001")).toBeNull();
  });

  it("returns null for unknown carrier", () => {
    expect(getTrackingUrl("dhl", "DHL123")).toBeNull();
  });

  it("returns null when tracking number is missing", () => {
    expect(getTrackingUrl("canada_post", null)).toBeNull();
    expect(getTrackingUrl("canada_post", "")).toBeNull();
  });

  it("returns null when carrier is missing", () => {
    expect(getTrackingUrl(null, "12345")).toBeNull();
    expect(getTrackingUrl("", "12345")).toBeNull();
  });
});

// ── S3: Carrier display helpers ─────────────────────────────────────────────

describe("S3: carrier display helpers", () => {
  it("returns label for all known carriers", () => {
    expect(getCarrierLabel("canada_post")).toBe("Canada Post");
    expect(getCarrierLabel("purolator")).toBe("Purolator");
    expect(getCarrierLabel("ups")).toBe("UPS");
    expect(getCarrierLabel("fedex")).toBe("FedEx");
    expect(getCarrierLabel("pickup")).toBe("Pickup");
  });

  it("falls back to raw carrier string for unknown", () => {
    expect(getCarrierLabel("dhl")).toBe("dhl");
  });

  it("returns dash for null/undefined", () => {
    expect(getCarrierLabel(null)).toBe("—");
    expect(getCarrierLabel(undefined)).toBe("—");
  });

  it("returns color for all known carriers", () => {
    for (const key of Object.keys(CARRIERS)) {
      const color = getCarrierColor(key);
      expect(color).toBeTruthy();
      expect(color).toContain("bg-");
    }
  });
});

// ── S4: Shipment status display helpers ─────────────────────────────────────

describe("S4: shipment status display helpers", () => {
  it("returns label for all known statuses", () => {
    expect(getShipmentStatusLabel("pending")).toBe("Pending");
    expect(getShipmentStatusLabel("label_created")).toBe("Label Created");
    expect(getShipmentStatusLabel("picked_up")).toBe("Picked Up");
    expect(getShipmentStatusLabel("in_transit")).toBe("In Transit");
    expect(getShipmentStatusLabel("delivered")).toBe("Delivered");
    expect(getShipmentStatusLabel("returned")).toBe("Returned");
    expect(getShipmentStatusLabel("exception")).toBe("Exception");
  });

  it("falls back to raw status for unknown", () => {
    expect(getShipmentStatusLabel("lost")).toBe("lost");
  });

  it("returns dash for null/undefined", () => {
    expect(getShipmentStatusLabel(null)).toBe("—");
  });

  it("returns color for all known statuses", () => {
    for (const key of Object.keys(SHIPMENT_STATUS)) {
      const color = getShipmentStatusColor(key);
      expect(color).toBeTruthy();
      expect(color).toContain("bg-");
    }
  });
});

// ── S5: Edge cases ──────────────────────────────────────────────────────────

describe("S5: edge cases", () => {
  it("single pending shipment with no tracking", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "pending", carrier: "canada_post", trackingNumber: null },
    ]);
    expect(result.state).toBe("pending");
    expect(result.trackingNumbers).toEqual([]);
    expect(result.shipmentCount).toBe(1);
  });

  it("multiple shipments all delivered", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "delivered", carrier: "canada_post", trackingNumber: "A" },
      { id: "s2", status: "delivered", carrier: "ups", trackingNumber: "B" },
    ]);
    expect(result.state).toBe("delivered");
    expect(result.shipmentCount).toBe(2);
  });

  it("returned surfaces over pending", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "pending", carrier: "canada_post", trackingNumber: null },
      { id: "s2", status: "returned", carrier: "ups", trackingNumber: "RET1" },
    ]);
    expect(result.state).toBe("returned");
  });

  it("label_created surfaces over pending", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "pending", carrier: "canada_post", trackingNumber: null },
      { id: "s2", status: "label_created", carrier: "ups", trackingNumber: "LBL1" },
    ]);
    expect(result.state).toBe("label_created");
  });

  it("fulfillment label and color match SHIPMENT_STATUS", () => {
    const result = getOrderFulfillment([
      { id: "s1", status: "in_transit", carrier: "canada_post", trackingNumber: "123" },
    ]);
    expect(result.label).toBe(SHIPMENT_STATUS.in_transit.label);
    expect(result.color).toBe(SHIPMENT_STATUS.in_transit.color);
  });
});

describe("S6: carrier normalization and order-state mapping", () => {
  it("normalizes known carrier labels and codes", () => {
    expect(normalizeCarrierCode("Canada Post")).toBe("canada_post");
    expect(normalizeCarrierCode("canada-post")).toBe("canada_post");
    expect(normalizeCarrierCode("UPS")).toBe("ups");
    expect(normalizeCarrierCode("pickup")).toBe("pickup");
  });

  it("falls back to 'other' for unknown carrier strings", () => {
    expect(normalizeCarrierCode("DHL")).toBe("other");
  });

  it("treats dispatched shipment statuses as shipped order state", () => {
    expect(shipmentStatusMarksOrderShipped("picked_up")).toBe(true);
    expect(shipmentStatusMarksOrderShipped("in_transit")).toBe(true);
    expect(shipmentStatusMarksOrderShipped("delivered")).toBe(true);
    expect(shipmentStatusMarksOrderShipped("returned")).toBe(true);
    expect(shipmentStatusMarksOrderShipped("exception")).toBe(true);
    expect(getOrderProductionStatusForShipmentStatus("picked_up")).toBe("shipped");
  });

  it("does not mark pending or label-created shipments as shipped orders", () => {
    expect(shipmentStatusMarksOrderShipped("pending")).toBe(false);
    expect(shipmentStatusMarksOrderShipped("label_created")).toBe(false);
    expect(getOrderProductionStatusForShipmentStatus("pending")).toBeNull();
    expect(getOrderProductionStatusForShipmentStatus("label_created")).toBeNull();
  });
});

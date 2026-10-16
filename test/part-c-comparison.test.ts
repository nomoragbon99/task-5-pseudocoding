import { describe, it, expect, beforeEach } from "vitest";
import { calculateOrderDiscount, OrderDiscountInput } from "../src/discount.js";
import { calculateOrderDiscountAI, aiAuditTrail } from "../src/aiDiscount.js";

describe("Part C: 10-Input Comparison Showdown (Manual vs. AI)", () => {
  beforeEach(() => {
    aiAuditTrail.length = 0; // Clear unasked audit trail between tests
  });

  // ---------------------------------------------------------------------------
  // Input 1: Original Scenario 1 (Normal percent discount with cap not exceeded)
  // ---------------------------------------------------------------------------
  it("Input 1: Normal valid percent discount (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 8000,
      customerId: "cust-101",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "SAVE15",
      discountType: "percent",
      discountValue: 15,
      minSubtotalMinor: 5000,
      maxDiscountMinor: 2000,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: ["cust-999"],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(1200);
    expect(aiResult).toBe(1200);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 2: Original Scenario 2 (Subtotal below minimum spend)
  // ---------------------------------------------------------------------------
  it("Input 2: Subtotal below minimum spend threshold (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 4000,
      customerId: "cust-102",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "MIN50",
      discountType: "fixed",
      discountValue: 1000,
      minSubtotalMinor: 5000,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(0);
    expect(aiResult).toBe(0);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 3: Original Scenario 3 (Expired discount code)
  // ---------------------------------------------------------------------------
  it("Input 3: Clearly expired discount code (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 10000,
      customerId: "cust-103",
      customerOrderCount: 2,
      orderTimestamp: new Date("2026-10-25T15:00:00Z"),
      promoCode: "EXPIRED20",
      discountType: "percent",
      discountValue: 20,
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(0);
    expect(aiResult).toBe(0);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 4: Original Scenario 4 (Single-use violation)
  // ---------------------------------------------------------------------------
  it("Input 4: Single-use violation (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 6000,
      customerId: "cust-104",
      customerOrderCount: 1,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "ONETIME",
      discountType: "fixed",
      discountValue: 1500,
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: ["cust-100", "cust-104", "cust-200"],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(0);
    expect(aiResult).toBe(0);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 5: Original Scenario 5 (Percent discount cap clamping)
  // ---------------------------------------------------------------------------
  it("Input 5: Percent discount calculation exceeds cap (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 20000,
      customerId: "cust-105",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "BIGDEAL",
      discountType: "percent",
      discountValue: 25,
      minSubtotalMinor: 5000,
      maxDiscountMinor: 3000,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(3000);
    expect(aiResult).toBe(3000);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 6: Boundary Second on Expiration (Agreement: NO - DISCREPANCY REVEALED!)
  // ---------------------------------------------------------------------------
  it("Input 6: Exact boundary second on expiration (Agreement: NO)", () => {
    const boundaryTime = new Date("2026-10-20T00:00:00.000Z");
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 10000,
      customerId: "cust-106",
      customerOrderCount: 0,
      orderTimestamp: boundaryTime, // EXACT same millisecond as validUntilUtc
      promoCode: "BOUNDARY10",
      discountType: "percent",
      discountValue: 10,
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: boundaryTime,
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    // Specification says: "IF orderTimestamp >= validUntilUtc THEN RETURN 0"
    expect(manualResult).toBe(0);

    // AI bug/interpretation says: "IF orderTimestamp > validUntilUtc THEN RETURN 0"
    // So on equal timestamp, AI incorrectly grants the 10% discount ($10.00 = 1000 cents)!
    expect(aiResult).toBe(1000);
    expect(aiResult).not.toBe(manualResult); // Discrepancy confirmed!
  });

  // ---------------------------------------------------------------------------
  // Input 7: Subtotal exactly equal to minSubtotalMinor
  // ---------------------------------------------------------------------------
  it("Input 7: Subtotal exactly equal to minSubtotalMinor boundary (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 5000, // Exactly $50.00
      customerId: "cust-107",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "EXACT50",
      discountType: "fixed",
      discountValue: 1000,
      minSubtotalMinor: 5000, // Exactly $50.00
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(1000);
    expect(aiResult).toBe(1000);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 8: 100% discount on percent type
  // ---------------------------------------------------------------------------
  it("Input 8: 100% discount rate on percent type (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 7500,
      customerId: "cust-108",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "FREE100",
      discountType: "percent",
      discountValue: 100, // 100% free order
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(7500);
    expect(aiResult).toBe(7500);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 9: First-order flag true, but customerOrderCount is exactly 1
  // ---------------------------------------------------------------------------
  it("Input 9: First-order flag true but customerOrderCount is 1 (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 6000,
      customerId: "cust-109",
      customerOrderCount: 1, // Repeat customer with 1 past order
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "WELCOMEONLY",
      discountType: "fixed",
      discountValue: 1500,
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: true, // Restricted to first-time customer
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(0);
    expect(aiResult).toBe(0);
    expect(aiResult).toBe(manualResult);
  });

  // ---------------------------------------------------------------------------
  // Input 10: Fixed discount greater than orderSubtotalMinor (clamping test)
  // ---------------------------------------------------------------------------
  it("Input 10: Fixed discount exceeds subtotal with clamping (Agreement: YES)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 1500, // $15.00 subtotal
      customerId: "cust-110",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "SUPER30",
      discountType: "fixed",
      discountValue: 3000, // $30.00 discount (> $15.00 subtotal)
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const manualResult = calculateOrderDiscount(input);
    const aiResult = calculateOrderDiscountAI(input);

    expect(manualResult).toBe(1500); // Clamped to subtotal so total is 0
    expect(aiResult).toBe(1500);
    expect(aiResult).toBe(manualResult);
  });

  it("Verification of Unasked Addition: AI populates global audit trail", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 5000,
      customerId: "cust-audit-test",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "AUDITTEST",
      discountType: "fixed",
      discountValue: 500,
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    calculateOrderDiscountAI(input);

    expect(aiAuditTrail.length).toBe(1);
    expect(aiAuditTrail[0].customerId).toBe("cust-audit-test");
    expect(aiAuditTrail[0].promoCode).toBe("AUDITTEST");
    expect(aiAuditTrail[0].calculatedDiscountMinor).toBe(500);
  });
});

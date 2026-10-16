import { describe, it, expect } from "vitest";
import { calculateOrderDiscount, OrderDiscountInput } from "../src/discount.js";

describe("Part B: Promotional Checkout Discount Engine", () => {
  it("Scenario 1: Normal valid percent discount with cap not exceeded", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 8000, // $80.00
      customerId: "cust-101",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "SAVE15",
      discountType: "percent",
      discountValue: 15, // 15%
      minSubtotalMinor: 5000, // $50.00 min spend
      maxDiscountMinor: 2000, // $20.00 cap
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: ["cust-999"],
    };

    const discount = calculateOrderDiscount(input);

    // 15% of 8000 = 1200 ($12.00). Cap is 2000, so 1200 applies cleanly.
    expect(discount).toBe(1200);
    expect(input.orderSubtotalMinor - discount).toBe(6800);
  });

  it("Scenario 2: Subtotal below minimum spend threshold (discount = 0)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 4000, // $40.00 (< $50.00 threshold)
      customerId: "cust-102",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "MIN50",
      discountType: "fixed",
      discountValue: 1000, // $10.00
      minSubtotalMinor: 5000, // $50.00
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const discount = calculateOrderDiscount(input);
    expect(discount).toBe(0);
  });

  it("Scenario 3: Expired discount code (validUntilUtc < orderTimestamp)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 10000, // $100.00
      customerId: "cust-103",
      customerOrderCount: 2,
      orderTimestamp: new Date("2026-10-25T15:00:00Z"), // Order after Oct 20
      promoCode: "EXPIRED20",
      discountType: "percent",
      discountValue: 20, // 20%
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const discount = calculateOrderDiscount(input);
    expect(discount).toBe(0);
  });

  it("Scenario 4: Single-use violation (customer already redeemed code)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 6000, // $60.00
      customerId: "cust-104",
      customerOrderCount: 1,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "ONETIME",
      discountType: "fixed",
      discountValue: 1500, // $15.00
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: ["cust-100", "cust-104", "cust-200"],
    };

    const discount = calculateOrderDiscount(input);
    expect(discount).toBe(0);
  });

  it("Scenario 5: Edge case: percent discount calculation exceeds maxDiscountMinor cap (clamping applied)", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 20000, // $200.00
      customerId: "cust-105",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "BIGDEAL",
      discountType: "percent",
      discountValue: 25, // 25% of $200.00 = $50.00 (5000 cents)
      minSubtotalMinor: 5000,
      maxDiscountMinor: 3000, // $30.00 cap (3000 cents)
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const discount = calculateOrderDiscount(input);

    // 25% of 20000 is 5000, clamped by maxDiscountMinor (3000)
    expect(discount).toBe(3000);
    expect(input.orderSubtotalMinor - discount).toBe(17000);
  });

  it("Additional Edge Case: Clamps fixed discount to subtotal to prevent negative order totals", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 1000, // $10.00 subtotal
      customerId: "cust-106",
      customerOrderCount: 0,
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "FIXED25",
      discountType: "fixed",
      discountValue: 2500, // $25.00 fixed discount > subtotal
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: false,
      previousRedemptions: [],
    };

    const discount = calculateOrderDiscount(input);

    // Cannot exceed subtotal: clamped to 1000, final total = 0
    expect(discount).toBe(1000);
    expect(input.orderSubtotalMinor - discount).toBe(0);
  });

  it("Additional Gate Check: Rejects returning customer when firstOrderOnly is true", () => {
    const input: OrderDiscountInput = {
      orderSubtotalMinor: 5000,
      customerId: "cust-107",
      customerOrderCount: 3, // Returning customer (> 0)
      orderTimestamp: new Date("2026-10-16T12:00:00Z"),
      promoCode: "WELCOMEONLY",
      discountType: "fixed",
      discountValue: 1000,
      minSubtotalMinor: 0,
      maxDiscountMinor: null,
      validUntilUtc: new Date("2026-10-20T00:00:00Z"),
      firstOrderOnly: true,
      previousRedemptions: [],
    };

    const discount = calculateOrderDiscount(input);
    expect(discount).toBe(0);
  });
});

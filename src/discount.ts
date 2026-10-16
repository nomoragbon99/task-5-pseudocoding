export type DiscountType = "percent" | "fixed";

export interface OrderDiscountInput {
  orderSubtotalMinor: number;
  customerId: string;
  customerOrderCount: number;
  orderTimestamp: Date;
  promoCode: string;
  discountType: DiscountType;
  discountValue: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  validUntilUtc: Date;
  firstOrderOnly: boolean;
  previousRedemptions: string[];
}

/**
 * Calculates the promotional discount amount in minor currency units (cents).
 * Implemented directly from the pseudocode in part-b/discount-engine.pseudo.txt.
 */
export function calculateOrderDiscount(input: OrderDiscountInput): number {
  // -------------------------------------------------------------------------
  // STEP 1: Validate all incoming order and promotional configuration parameters.
  // -------------------------------------------------------------------------
  if (!Number.isInteger(input.orderSubtotalMinor) || input.orderSubtotalMinor < 0) {
    throw new Error("orderSubtotalMinor must be a non-negative integer");
  }

  if (typeof input.customerId !== "string" || input.customerId.trim().length === 0) {
    throw new Error("customerId must be a non-empty string");
  }

  if (!Number.isInteger(input.customerOrderCount) || input.customerOrderCount < 0) {
    throw new Error("customerOrderCount must be a non-negative integer");
  }

  if (input.discountType !== "percent" && input.discountType !== "fixed") {
    throw new Error("discountType must be either percent or fixed");
  }

  if (typeof input.discountValue !== "number" || input.discountValue <= 0 || !Number.isFinite(input.discountValue)) {
    throw new Error("discountValue must be greater than 0");
  }

  if (input.discountType === "percent" && input.discountValue > 100) {
    throw new Error("discountValue for percent discounts cannot exceed 100");
  }

  if (!Number.isInteger(input.minSubtotalMinor) || input.minSubtotalMinor < 0) {
    throw new Error("minSubtotalMinor cannot be negative");
  }

  if (
    input.maxDiscountMinor !== null &&
    (!Number.isInteger(input.maxDiscountMinor) || input.maxDiscountMinor <= 0)
  ) {
    throw new Error("maxDiscountMinor must be greater than 0 when specified");
  }

  // -------------------------------------------------------------------------
  // STEP 2: Check the single-use per customer restriction.
  // -------------------------------------------------------------------------
  for (const redeemedCustomerId of input.previousRedemptions) {
    if (redeemedCustomerId === input.customerId) {
      return 0;
    }
  }

  // -------------------------------------------------------------------------
  // STEP 3: Check promotional code expiration.
  // -------------------------------------------------------------------------
  if (input.orderTimestamp.getTime() >= input.validUntilUtc.getTime()) {
    return 0;
  }

  // -------------------------------------------------------------------------
  // STEP 4: Check the first-order-only qualification rule.
  // -------------------------------------------------------------------------
  if (input.firstOrderOnly && input.customerOrderCount > 0) {
    return 0;
  }

  // -------------------------------------------------------------------------
  // STEP 5: Enforce the minimum order subtotal spend threshold.
  // -------------------------------------------------------------------------
  if (input.orderSubtotalMinor < input.minSubtotalMinor) {
    return 0;
  }

  // -------------------------------------------------------------------------
  // STEP 6: Compute the raw discount amount based on the promotional discount type.
  // -------------------------------------------------------------------------
  let rawDiscount: number;

  if (input.discountType === "fixed") {
    rawDiscount = input.discountValue;
  } else {
    // discountType is "percent"
    const percentageFraction = input.discountValue / 100;
    const percentageDiscount = Math.round(input.orderSubtotalMinor * percentageFraction);

    if (input.maxDiscountMinor !== null && percentageDiscount > input.maxDiscountMinor) {
      rawDiscount = input.maxDiscountMinor;
    } else {
      rawDiscount = percentageDiscount;
    }
  }

  // -------------------------------------------------------------------------
  // STEP 7: Clamp the raw discount so the final order total never drops below zero.
  // -------------------------------------------------------------------------
  let finalDiscount: number;
  if (rawDiscount > input.orderSubtotalMinor) {
    finalDiscount = input.orderSubtotalMinor;
  } else {
    finalDiscount = rawDiscount;
  }

  // -------------------------------------------------------------------------
  // STEP 8: RETURN finalDiscount.
  // -------------------------------------------------------------------------
  return finalDiscount;
}

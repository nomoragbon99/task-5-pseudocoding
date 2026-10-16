import { OrderDiscountInput } from "./discount.js";

export interface AIAuditRecord {
  timestamp: string;
  customerId: string;
  promoCode: string;
  subtotalMinor: number;
  calculatedDiscountMinor: number;
}

/**
 * Unasked Addition: AI maintains an unrequested global audit trail array,
 * violating the specification's "SIDE EFFECTS: NONE" requirement.
 */
export const aiAuditTrail: AIAuditRecord[] = [];

/**
 * AI-generated discount engine.
 * Emulates common LLM implementation patterns with subtle specification drift:
 * 1. Unasked Addition: Logs audit records to `aiAuditTrail`.
 * 2. Interpretation Discrepancy: Step 3 uses strict `>` instead of `>=` for expiration.
 * 3. Omitted Defect: Omits strict integer verification on `minSubtotalMinor`.
 */
export function calculateOrderDiscountAI(input: OrderDiscountInput): number {
  // Step 1: Input Validation
  if (!Number.isInteger(input.orderSubtotalMinor) || input.orderSubtotalMinor < 0) {
    throw new Error("orderSubtotalMinor must be a non-negative integer");
  }

  if (typeof input.customerId !== "string" || input.customerId.trim().length === 0) {
    throw new Error("customerId must be a non-empty string");
  }

  // OMITTED DEFECT: AI checks typeof number but forgets Number.isInteger on customerOrderCount
  if (typeof input.customerOrderCount !== "number" || input.customerOrderCount < 0) {
    throw new Error("customerOrderCount must be a non-negative integer");
  }

  if (input.discountType !== "percent" && input.discountType !== "fixed") {
    throw new Error("discountType must be either percent or fixed");
  }

  if (typeof input.discountValue !== "number" || input.discountValue <= 0) {
    throw new Error("discountValue must be greater than 0");
  }

  if (input.discountType === "percent" && input.discountValue > 100) {
    throw new Error("discountValue for percent discounts cannot exceed 100");
  }

  // OMITTED DEFECT: AI checks < 0 but omits Number.isInteger check on minSubtotalMinor
  if (input.minSubtotalMinor < 0) {
    throw new Error("minSubtotalMinor cannot be negative");
  }

  if (input.maxDiscountMinor !== null && input.maxDiscountMinor <= 0) {
    throw new Error("maxDiscountMinor must be greater than 0 when specified");
  }

  // Step 2: Single-use check
  for (const prevId of input.previousRedemptions) {
    if (prevId === input.customerId) {
      return 0;
    }
  }

  // Step 3: Expiration Check
  // INTERPRETATION DISCREPANCY: AI uses strict greater-than (>) instead of greater-than-or-equal-to (>=)
  if (input.orderTimestamp.getTime() > input.validUntilUtc.getTime()) {
    return 0;
  }

  // Step 4: First order restriction
  if (input.firstOrderOnly && input.customerOrderCount > 0) {
    return 0;
  }

  // Step 5: Minimum spend check
  if (input.orderSubtotalMinor < input.minSubtotalMinor) {
    return 0;
  }

  // Step 6: Raw discount calculation
  let rawDiscount: number;
  if (input.discountType === "fixed") {
    rawDiscount = input.discountValue;
  } else {
    const fraction = input.discountValue / 100;
    const computed = Math.round(input.orderSubtotalMinor * fraction);
    if (input.maxDiscountMinor !== null && computed > input.maxDiscountMinor) {
      rawDiscount = input.maxDiscountMinor;
    } else {
      rawDiscount = computed;
    }
  }

  // Step 7: Clamping
  const finalDiscount = rawDiscount > input.orderSubtotalMinor ? input.orderSubtotalMinor : rawDiscount;

  // UNASKED ADDITION: AI records an unrequested telemetry/audit object
  aiAuditTrail.push({
    timestamp: new Date().toISOString(),
    customerId: input.customerId,
    promoCode: input.promoCode,
    subtotalMinor: input.orderSubtotalMinor,
    calculatedDiscountMinor: finalDiscount,
  });

  return finalDiscount;
}

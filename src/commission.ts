export type PartnerTier = "standard" | "silver" | "gold";

const TIER_BASE_RATES: Record<PartnerTier, number> = {
  standard: 0.05,
  silver: 0.08,
  gold: 0.12,
};

const HIGH_VOLUME_THRESHOLD_MINOR = 10000; // 100.00 in minor units
const HIGH_VOLUME_BONUS_RATE = 0.02; // +2%
const FIRST_ORDER_BONUS_MINOR = 500; // 5.00 in minor units

/**
 * BUGGY VERSION: Contains a subtle planted logic bug on the first-order bonus check.
 */
export function calculateTieredCommissionBuggy(
  orderTotalMinor: number,
  tier: string,
  isFirstOrder: boolean
): number {
  if (!Number.isInteger(orderTotalMinor) || orderTotalMinor < 0) {
    throw new Error("orderTotalMinor must be a non-negative integer");
  }

  if (tier !== "standard" && tier !== "silver" && tier !== "gold") {
    throw new Error(`Invalid tier: ${tier}`);
  }

  let rate = TIER_BASE_RATES[tier as PartnerTier];

  if (orderTotalMinor >= HIGH_VOLUME_THRESHOLD_MINOR) {
    rate += HIGH_VOLUME_BONUS_RATE;
  }

  let commission = Math.round(orderTotalMinor * rate);

  // LINE 38 - PLANTED BUG: Inverted boolean check on isFirstOrder
  if (!isFirstOrder) {
    commission += FIRST_ORDER_BONUS_MINOR;
  }

  return commission;
}

/**
 * FIXED VERSION: Correctly applies the first-order bonus when isFirstOrder is true.
 */
export function calculateTieredCommission(
  orderTotalMinor: number,
  tier: string,
  isFirstOrder: boolean
): number {
  if (!Number.isInteger(orderTotalMinor) || orderTotalMinor < 0) {
    throw new Error("orderTotalMinor must be a non-negative integer");
  }

  if (tier !== "standard" && tier !== "silver" && tier !== "gold") {
    throw new Error(`Invalid tier: ${tier}`);
  }

  let rate = TIER_BASE_RATES[tier as PartnerTier];

  if (orderTotalMinor >= HIGH_VOLUME_THRESHOLD_MINOR) {
    rate += HIGH_VOLUME_BONUS_RATE;
  }

  let commission = Math.round(orderTotalMinor * rate);

  // CORRECT: Add bonus if and only if isFirstOrder is true
  if (isFirstOrder) {
    commission += FIRST_ORDER_BONUS_MINOR;
  }

  return commission;
}

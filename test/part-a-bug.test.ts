import { describe, it, expect } from "vitest";
import {
  calculateTieredCommissionBuggy,
  calculateTieredCommission,
} from "../src/commission.js";

describe("Part A3: Planted Bug Verification", () => {
  describe("Buggy Function Failure Verification", () => {
    it("fails to award first-order bonus when isFirstOrder is true", () => {
      // Order: 5000 minor units ($50.00), standard tier (5% = 250 units), first order (+500 units)
      // Expected by business: 250 + 500 = 750
      // Buggy behavior: 250 (missing 500 bonus)
      const buggyResult = calculateTieredCommissionBuggy(5000, "standard", true);
      expect(buggyResult).toBe(250);
      expect(buggyResult).not.toBe(750); // Demonstrates bug failure!
    });

    it("erroneously awards first-order bonus when isFirstOrder is false", () => {
      // Order: 5000 minor units ($50.00), standard tier (5% = 250 units), returning order (+0 units)
      // Expected by business: 250
      // Buggy behavior: 250 + 500 = 750 (improperly granted bonus)
      const buggyResult = calculateTieredCommissionBuggy(5000, "standard", false);
      expect(buggyResult).toBe(750);
      expect(buggyResult).not.toBe(250); // Demonstrates bug failure!
    });
  });

  describe("Fixed Function Correctness Verification", () => {
    it("correctly awards first-order bonus for new customer orders", () => {
      // Standard tier (5%): 5000 * 0.05 = 250. First order bonus: +500. Total = 750
      expect(calculateTieredCommission(5000, "standard", true)).toBe(750);

      // Silver tier (8%): 5000 * 0.08 = 400. First order bonus: +500. Total = 900
      expect(calculateTieredCommission(5000, "silver", true)).toBe(900);

      // Gold tier (12%): 5000 * 0.12 = 600. First order bonus: +500. Total = 1100
      expect(calculateTieredCommission(5000, "gold", true)).toBe(1100);
    });

    it("does not award first-order bonus for repeat customer orders", () => {
      // Standard tier: 5000 * 0.05 = 250. No bonus.
      expect(calculateTieredCommission(5000, "standard", false)).toBe(250);

      // Silver tier: 5000 * 0.08 = 400. No bonus.
      expect(calculateTieredCommission(5000, "silver", false)).toBe(400);

      // Gold tier: 5000 * 0.12 = 600. No bonus.
      expect(calculateTieredCommission(5000, "gold", false)).toBe(600);
    });

    it("applies volume bonus (+2%) when order total >= 10000 minor units ($100.00)", () => {
      // 10000 units on silver tier (8% + 2% = 10%): 10000 * 0.10 = 1000. Repeat order: 1000
      expect(calculateTieredCommission(10000, "silver", false)).toBe(1000);

      // 10000 units on silver tier with first order bonus: 1000 + 500 = 1500
      expect(calculateTieredCommission(10000, "silver", true)).toBe(1500);

      // Edge case: 9999 units (just below threshold) on silver (8% only): 9999 * 0.08 = 799.92 -> round(800)
      expect(calculateTieredCommission(9999, "silver", false)).toBe(800);
    });

    it("throws errors on invalid inputs", () => {
      expect(() => calculateTieredCommission(-100, "standard", true)).toThrow(
        "orderTotalMinor must be a non-negative integer"
      );
      expect(() => calculateTieredCommission(50.5, "standard", true)).toThrow(
        "orderTotalMinor must be a non-negative integer"
      );
      expect(() => calculateTieredCommission(5000, "platinum", true)).toThrow(
        "Invalid tier: platinum"
      );
    });
  });
});

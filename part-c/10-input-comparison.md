# Part C: 10-Input Comparison Showdown (Specification vs. AI Implementation)

This matrix documents the execution showdown across 10 diverse test inputs between the manual specification implementation (`src/discount.ts`) and the AI-generated implementation (`src/aiDiscount.ts`).

---

## 1. Showdown Results Matrix

| # | Input Description | Core Test Condition | Manual Output | AI Output | Agreement? | Correct Implementation & Justification |
| :-: | :--- | :--- | :-: | :-: | :-: | :--- |
| **1** | $80.00 order, 15% off, $20.00 cap, $50.00 min spend | Normal percent path | **1200** | **1200** | **YES** | Both calculate $8000 \times 0.15 = 1200$, under cap. |
| **2** | $40.00 order, $10.00 off, $50.00 min spend | Subtotal < min spend | **0** | **0** | **YES** | Both correctly trigger minimum subtotal guard ($4000 < 5000$). |
| **3** | $100.00 order, promo expired 5 days ago | Obvious expiration | **0** | **0** | **YES** | Both detect Oct 25 > Oct 20 expiration cutoff. |
| **4** | $60.00 order, customer in `previousRedemptions` | Single-use violation | **0** | **0** | **YES** | Both detect customer ID in redemptions array. |
| **5** | $200.00 order, 25% off, $30.00 cap | Cap clamping | **3000** | **3000** | **YES** | Both calculate $50.00 and clamp down to $30.00 cap. |
| **6** | $100.00 order, `orderTimestamp === validUntilUtc` | **Exact expiration boundary** | **0** | **1000** | **NO** | **MANUAL IS CORRECT.** Specification states `orderTimestamp >= validUntilUtc` aborts. AI used `>` and improperly granted $10.00. |
| **7** | $50.00 order, $50.00 minimum spend threshold | Exact threshold boundary | **1000** | **1000** | **YES** | Both verify spend boundary condition ($5000 \ge 5000$). |
| **8** | $75.00 order, 100% percent discount | Maximum allowable rate | **7500** | **7500** | **YES** | Both apply 100% reduction, yielding $0.00 final total. |
| **9** | First-order only promo, customer has 1 prior order | Returning customer guard | **0** | **0** | **YES** | Both enforce `customerOrderCount > 0` rejection. |
| **10**| $15.00 order, $30.00 fixed discount | Subtotal over-clamping | **1500** | **1500** | **YES** | Both clamp discount to subtotal to prevent negative totals. |

---

## 2. In-Depth Discrepancy Breakdown for Input 6

### Test Setup
- `orderSubtotalMinor`: 10000 ($100.00)
- `orderTimestamp`: `2026-10-20T00:00:00.000Z`
- `validUntilUtc`: `2026-10-20T00:00:00.000Z`
- `discountType`: "percent" (10%)

### Behavior Analysis
- **Manual Implementation (`src/discount.ts`):**
  Evaluated Step 3:
  ```typescript
  if (input.orderTimestamp.getTime() >= input.validUntilUtc.getTime()) {
    return 0;
  }
  ```
  Since the timestamps are equal down to the millisecond, the condition evaluated to `true`. The discount returned was `0`.
- **AI Implementation (`src/aiDiscount.ts`):**
  Evaluated Step 3:
  ```typescript
  if (input.orderTimestamp.getTime() > input.validUntilUtc.getTime()) {
    return 0;
  }
  ```
  Since `orderTimestamp` was equal to (not strictly greater than) `validUntilUtc`, the condition evaluated to `false`. The AI bypassed the expiration guard and granted a 1000 minor unit ($10.00) discount.

### Verdict
The **Manual Specification is correct**. In commercial retail and checkout systems, promotional expiration timestamps specify the exclusive expiration deadline. An offer valid until midnight expires upon the arrival of midnight. The AI's substitution of `>` for `>=` creates a one-second/millisecond loophole where expired coupons continue to execute.

# Part B: Hand-Trace vs. Code Execution Verification Results

This report provides the comparative proof between the hand-trace predictions formulated in `part-b/trace-tables.md` and the actual execution outputs produced by `test/part-b.test.ts` running against `src/discount.ts`.

---

## 1. Summary Comparison Table

| Scenario # | Scenario Description | Hand-Trace Predicted Output | Actual Vitest Code Output | Match Status | Verification Details |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | Normal valid percent discount (15% on $80.00 subtotal, cap $20.00 not exceeded) | **1200** minor units ($12.00) | **1200** minor units ($12.00) | **PASS (EXACT)** | 8000 * 0.15 = 1200 <= 2000 cap. Applied in full. |
| **2** | Subtotal below minimum spend ($40.00 order with $50.00 min threshold) | **0** minor units ($0.00) | **0** minor units ($0.00) | **PASS (EXACT)** | Early return at Step 5 (`subtotalMinor < minSubtotalMinor`). |
| **3** | Expired promo code (`validUntilUtc` of Oct 20 vs order placed on Oct 25) | **0** minor units ($0.00) | **0** minor units ($0.00) | **PASS (EXACT)** | Early return at Step 3 (`orderTimestamp >= validUntilUtc`). |
| **4** | Single-use per customer violation (`customerId` in `previousRedemptions`) | **0** minor units ($0.00) | **0** minor units ($0.00) | **PASS (EXACT)** | Early return at Step 2 (`redeemedCustomerId === customerId`). |
| **5** | Percent discount exceeds maximum cap (25% on $200.00 = $50.00, cap is $30.00) | **3000** minor units ($30.00) | **3000** minor units ($30.00) | **PASS (EXACT)** | Step 6c clamps raw discount from 5000 down to 3000. |

---

## 2. In-Depth Analysis of Trace Alignment

### Scenario 1 (Normal Execution)
- **Trace Prediction:** Step 1 through Step 5 pass without early termination. Step 6 calculates $8000 \times 0.15 = 1200$ cents. Step 6c verifies $1200 \le 2000$ cap. Step 7 confirms $1200 \le 8000$ subtotal. Result: `1200`.
- **Code Execution:** `calculateOrderDiscount(input)` returned `1200`. Resulting subtotal was asserted at $8000 - 1200 = 6800$ cents ($68.00). Identical.

### Scenario 2 (Minimum Spend Guard)
- **Trace Prediction:** Subtotal of 4000 fails Step 5 check ($4000 < 5000$). Early return triggered at Step 5 yielding `0`.
- **Code Execution:** `calculateOrderDiscount(input)` exited at line 82 (`if (input.orderSubtotalMinor < input.minSubtotalMinor) return 0;`), returning `0`. Identical.

### Scenario 3 (Expiration Guard)
- **Trace Prediction:** Timestamp comparison at Step 3 reveals order placed at 2026-10-25T15:00:00Z exceeds expiration cutoff of 2026-10-20T00:00:00Z. Early exit returns `0`.
- **Code Execution:** `calculateOrderDiscount(input)` exited at line 68 (`if (input.orderTimestamp.getTime() >= input.validUntilUtc.getTime()) return 0;`), returning `0`. Identical.

### Scenario 4 (Single-Use Guard)
- **Trace Prediction:** Step 2 iterates through `previousRedemptions`. On index 1, "cust-104" matches `customerId`. Early exit immediately returns `0`.
- **Code Execution:** `calculateOrderDiscount(input)` loop matched on iteration 2, returning `0`. Identical.

### Scenario 5 (Cap Clamping)
- **Trace Prediction:** Uncapped percent discount is $20000 \times 0.25 = 5000$ cents. Step 6c detects $5000 > 3000$, clamping `rawDiscount` to `3000`. Step 7 confirms $3000 \le 20000$. Final return is `3000`.
- **Code Execution:** `calculateOrderDiscount(input)` returned `3000`. Resulting order total was asserted at $20000 - 3000 = 17000$ cents ($170.00). Identical.

---

## 3. Conclusion
The TypeScript implementation in `src/discount.ts` mirrors the pseudocode specification in `part-b/discount-engine.pseudo.txt` line-by-line. All automated test traces in Vitest validate the hand-trace predictions with 100% precision.

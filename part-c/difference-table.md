# Part C: Pseudocode Specification vs. AI Implementation Difference Table

This document provides a side-by-side comparison between the official specification (`part-b/discount-engine.pseudo.txt`) and the reverse-engineered pseudocode (`part-c/ai-reverse-engineered.pseudo.txt`) extracted from the AI's implementation in `src/aiDiscount.ts`.

---

## 1. Side-by-Side Comparison Matrix

| Section / Step | Original Specification (Part B) | Reverse-Engineered AI Code (Part C) | Discrepancy Category | Technical Impact & Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Header: Side Effects** | `SIDE EFFECTS: NONE` | `SIDE EFFECTS: WRITE appends an audit record to aiAuditTrail` | **1. Added Unasked** | Violates purity constraint. Mutates global state and risks memory leaks in long-running processes. |
| **Step 1: Input Validation (`customerOrderCount`)** | `IF customerOrderCount is not a whole number OR customerOrderCount < 0 THEN RAISE ERROR` | `IF typeof customerOrderCount !== "number" OR customerOrderCount < 0 THEN RAISE ERROR` | **2. Omitted Defect** | The AI omitted the integer check (`Number.isInteger`). Non-integer floats (e.g., `1.5`) bypass validation. |
| **Step 1: Input Validation (`minSubtotalMinor`)** | `IF minSubtotalMinor is not an integer OR minSubtotalMinor < 0 THEN RAISE ERROR` | `IF minSubtotalMinor < 0 THEN RAISE ERROR` | **2. Omitted Defect** | AI dropped whole-number validation for minor currency units, permitting invalid fractional cents. |
| **Step 3: Expiration Boundary Check** | `IF orderTimestamp is greater than or equal to validUntilUtc THEN RETURN 0` | `IF orderTimestamp is strictly greater than validUntilUtc THEN RETURN 0` | **3. Specification Ambiguity** | On the exact boundary second (`orderTimestamp === validUntilUtc`), AI accepts the coupon instead of rejecting it. |
| **Step 8: Post-Execution Telemetry** | *Step does not exist* (Step 8 directly returns `finalDiscount`) | `WRITE audit record to global aiAuditTrail list` | **1. Added Unasked** | Feature creep. AI introduced unrequested analytics telemetry into an internal financial calculator. |

---

## 2. Detailed Discrepancy Categorization

### Category 1: Added Unasked (Feature Creep / Unsolicited State Mutation)
- **What Occurred:** The AI introduced `aiAuditTrail.push({...})` on line 87 of `src/aiDiscount.ts` to log order calculations.
- **Why It Matters:** The specification explicitly stated `SIDE EFFECTS: NONE`. Mutating an in-memory array causes unbounded memory growth in production environments, introduces concurrency race conditions, and violates functional programming guarantees expected by callers.
- **Remedy:** Delete the unrequested `aiAuditTrail` data structure and all write statements.

---

### Category 2: Omitted Defect (Dropped Validation Requirements)
- **What Occurred:**
  1. The AI validated `typeof input.customerOrderCount !== "number"` instead of `!Number.isInteger(input.customerOrderCount)`.
  2. The AI omitted `!Number.isInteger(input.minSubtotalMinor)`.
- **Why It Matters:** Minor currency units (cents) must be integers. Allowing floating-point values into monetary calculation engines causes precision truncation bugs and database schema insert failures.
- **Remedy:** Reintroduce explicit `Number.isInteger(...)` checks for all currency and count fields.

---

### Category 3: Specification Ambiguity & Resolution

#### The Ambiguity
In conversational specifications, engineers frequently say:
> "The promo code is valid until 2026-10-20T00:00:00Z."

- **Human / Business Interpretation:** At the stroke of midnight (00:00:00Z), the expiration date has arrived. The promotion is no longer usable; orders submitted at 00:00:00Z must be rejected (`orderTimestamp >= validUntilUtc`).
- **AI Interpretation:** "Valid until" was interpreted as an open interval $[-\infty, \text{validUntil}]$, meaning the promo remains valid throughout the timestamp until strictly after (`orderTimestamp > validUntilUtc`).

#### The Exact Revised Pseudocode Wording (Unambiguous Standard)
To eliminate any room for LLM misinterpretation, the pseudocode step must be revised from:

*Ambiguous Original:*
```text
3. Check promotional code expiration.
   IF orderTimestamp is greater than or equal to validUntilUtc THEN
     RETURN 0
   OTHERWISE continue.
```

*Unambiguous Revised Standard:*
```text
3. Enforce strict promotional expiration cutoff.
   Note: The promotion is considered active strictly BEFORE the expiration boundary.
   IF orderTimestamp is at or after validUntilUtc (orderTimestamp.getTime() >= validUntilUtc.getTime()) THEN
     RETURN 0 (Coupon is invalid on or after the exact expiration millisecond)
   OTHERWISE continue (Coupon is valid only while orderTimestamp is strictly earlier than validUntilUtc).
```

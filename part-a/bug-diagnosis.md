# Part A3: Planted Bug Diagnosis

## 1. Bug Identification
- **Target File:** `src/commission.ts`
- **Function:** `calculateTieredCommissionBuggy`
- **Exact Line Number:** Line 38
- **Bug Name / Classification:** Inverted Boolean Condition (Faulty Predicate) / Logic Gate Inversion

---

## 2. Code Snippet Comparison

### Buggy Code (`src/commission.ts:38`)
```typescript
  // Line 38 - Defective logic:
  if (!isFirstOrder) {
    commission += FIRST_ORDER_BONUS_MINOR;
  }
```

### Correct Code
```typescript
  // Fixed logic:
  if (isFirstOrder) {
    commission += FIRST_ORDER_BONUS_MINOR;
  }
```

---

## 3. Root Cause Analysis
The business requirement specifies:
> "If `isFirstOrder` is true, add a flat first-order bonus of 500 minor units ($5.00) to the total commission."

The implementation mistakenly applied the logical NOT operator (`!isFirstOrder`):
1. **When `isFirstOrder = true` (New Customer):**
   `!isFirstOrder` evaluates to `false`. The branch is bypassed. The first-time order receives **0 bonus units** ($0.00) instead of 500 units ($5.00).
2. **When `isFirstOrder = false` (Returning Customer):**
   `!isFirstOrder` evaluates to `true`. The branch executes. The returning order erroneously receives **500 bonus units** ($5.00).

---

## 4. Impact Analysis
- **Financial & Accounting:** Returning customers are continuously awarded a $5.00 bonus intended only for user acquisition, leading to cumulative overpayment of partner commissions and accounting discrepancies.
- **Partner Relations / Marketing:** New customer acquisition metrics and promotional incentives fail to reflect the intended bonus, confusing partners and distorting acquisition campaign ROI.

---

## 5. Resolution & Patch Diff

```diff
--- src/commission.ts
+++ src/commission.ts
@@ -35,7 +35,7 @@
   let commission = Math.round(orderTotalMinor * rate);
 
-  if (!isFirstOrder) {
+  if (isFirstOrder) {
     commission += FIRST_ORDER_BONUS_MINOR;
   }
 
   return commission;
```

# Part B: Promotional Checkout Discount Engine Hand-Trace Tables

This document details the step-by-step execution traces for five diverse scenarios evaluated against the pseudocode defined in `part-b/discount-engine.pseudo.txt`.

---

## Scenario 1: Normal Valid Percent Discount (Cap Not Exceeded)

### Input State
- `orderSubtotalMinor`: 8000 ($80.00)
- `customerId`: "cust-101"
- `customerOrderCount`: 0
- `orderTimestamp`: 2026-10-16T12:00:00Z
- `promoCode`: "SAVE15"
- `discountType`: "percent"
- `discountValue`: 15 (15%)
- `minSubtotalMinor`: 5000 ($50.00)
- `maxDiscountMinor`: 2000 ($20.00)
- `validUntilUtc`: 2026-10-20T00:00:00Z
- `firstOrderOnly`: false
- `previousRedemptions`: ["cust-999"]

### Step-by-Step Trace Table
| Step | Variables & State Evaluated | Condition / Computation | Next Action Taken |
| :--- | :--- | :--- | :--- |
| **1** | All input arguments | Type, range, and format checks | All inputs valid; continue to Step 2 |
| **2** | `previousRedemptions` = ["cust-999"] | Does "cust-999" equal "cust-101"? False | Loop terminates; continue to Step 3 |
| **3** | `orderTimestamp` (Oct 16) vs `validUntilUtc` (Oct 20) | Is Oct 16 >= Oct 20? False | Not expired; continue to Step 4 |
| **4** | `firstOrderOnly` = false, `customerOrderCount` = 0 | Is `firstOrderOnly` true? False | Condition False; continue to Step 5 |
| **5** | `orderSubtotalMinor` (8000) vs `minSubtotalMinor` (5000) | Is 8000 < 5000? False | Threshold satisfied; continue to Step 6 |
| **6a**| `discountType` = "percent" | Is type "percent"? True | Calculate percentage |
| **6b**| `discountValue` = 15, `orderSubtotalMinor` = 8000 | 8000 * (15 / 100) = 1200 | `percentageDiscount` = 1200 |
| **6c**| `maxDiscountMinor` = 2000 | Is 1200 > 2000? False | `rawDiscount` = 1200 |
| **7** | `rawDiscount` (1200) vs `orderSubtotalMinor` (8000) | Is 1200 > 8000? False | `finalDiscount` = 1200 |
| **8** | Return final output | Return `finalDiscount` | **RETURN 1200** |

**Predicted Output:** `1200` minor units ($12.00 discount). Order total becomes $68.00.

---

## Scenario 2: Subtotal Below Minimum Spend Threshold

### Input State
- `orderSubtotalMinor`: 4000 ($40.00)
- `customerId`: "cust-102"
- `customerOrderCount`: 0
- `orderTimestamp`: 2026-10-16T12:00:00Z
- `promoCode`: "MIN50"
- `discountType`: "fixed"
- `discountValue`: 1000 ($10.00)
- `minSubtotalMinor`: 5000 ($50.00)
- `maxDiscountMinor`: null
- `validUntilUtc`: 2026-10-20T00:00:00Z
- `firstOrderOnly`: false
- `previousRedemptions`: []

### Step-by-Step Trace Table
| Step | Variables & State Evaluated | Condition / Computation | Next Action Taken |
| :--- | :--- | :--- | :--- |
| **1** | All input arguments | Type, range, and format checks | All inputs valid; continue to Step 2 |
| **2** | `previousRedemptions` = [] | Empty list | Loop does not execute; continue to Step 3 |
| **3** | `orderTimestamp` (Oct 16) vs `validUntilUtc` (Oct 20) | Is Oct 16 >= Oct 20? False | Not expired; continue to Step 4 |
| **4** | `firstOrderOnly` = false, `customerOrderCount` = 0 | Is `firstOrderOnly` true? False | Condition False; continue to Step 5 |
| **5** | `orderSubtotalMinor` (4000) vs `minSubtotalMinor` (5000) | Is 4000 < 5000? **True** | Spend threshold failed; **RETURN 0** |

**Predicted Output:** `0` minor units (discount rejected due to insufficient subtotal spend).

---

## Scenario 3: Expired Discount Code

### Input State
- `orderSubtotalMinor`: 10000 ($100.00)
- `customerId`: "cust-103"
- `customerOrderCount`: 2
- `orderTimestamp`: 2026-10-25T15:00:00Z
- `promoCode`: "EXPIRED20"
- `discountType`: "percent"
- `discountValue`: 20 (20%)
- `minSubtotalMinor`: 0
- `maxDiscountMinor`: null
- `validUntilUtc`: 2026-10-20T00:00:00Z
- `firstOrderOnly`: false
- `previousRedemptions`: []

### Step-by-Step Trace Table
| Step | Variables & State Evaluated | Condition / Computation | Next Action Taken |
| :--- | :--- | :--- | :--- |
| **1** | All input arguments | Type, range, and format checks | All inputs valid; continue to Step 2 |
| **2** | `previousRedemptions` = [] | Empty list | Loop does not execute; continue to Step 3 |
| **3** | `orderTimestamp` (Oct 25) vs `validUntilUtc` (Oct 20) | Is Oct 25 >= Oct 20? **True** | Expiration condition met; **RETURN 0** |

**Predicted Output:** `0` minor units (discount rejected because promotion is expired).

---

## Scenario 4: Single-Use Per Customer Violation

### Input State
- `orderSubtotalMinor`: 6000 ($60.00)
- `customerId`: "cust-104"
- `customerOrderCount`: 1
- `orderTimestamp`: 2026-10-16T12:00:00Z
- `promoCode`: "ONETIME"
- `discountType`: "fixed"
- `discountValue`: 1500 ($15.00)
- `minSubtotalMinor`: 0
- `maxDiscountMinor`: null
- `validUntilUtc`: 2026-10-20T00:00:00Z
- `firstOrderOnly`: false
- `previousRedemptions`: ["cust-100", "cust-104", "cust-200"]

### Step-by-Step Trace Table
| Step | Variables & State Evaluated | Condition / Computation | Next Action Taken |
| :--- | :--- | :--- | :--- |
| **1** | All input arguments | Type, range, and format checks | All inputs valid; continue to Step 2 |
| **2a**| First entry: "cust-100" | Does "cust-100" equal "cust-104"? False | Continue loop |
| **2b**| Second entry: "cust-104" | Does "cust-104" equal "cust-104"? **True**| Single-use violation detected; **RETURN 0** |

**Predicted Output:** `0` minor units (discount rejected because customer already redeemed this promo).

---

## Scenario 5: Edge Case - Percent Discount Exceeds Cap (Clamping Applied)

### Input State
- `orderSubtotalMinor`: 20000 ($200.00)
- `customerId`: "cust-105"
- `customerOrderCount`: 0
- `orderTimestamp`: 2026-10-16T12:00:00Z
- `promoCode`: "BIGDEAL"
- `discountType`: "percent"
- `discountValue`: 25 (25%)
- `minSubtotalMinor`: 5000 ($50.00)
- `maxDiscountMinor`: 3000 ($30.00 maximum cap)
- `validUntilUtc`: 2026-10-20T00:00:00Z
- `firstOrderOnly`: false
- `previousRedemptions`: []

### Step-by-Step Trace Table
| Step | Variables & State Evaluated | Condition / Computation | Next Action Taken |
| :--- | :--- | :--- | :--- |
| **1** | All input arguments | Type, range, and format checks | All inputs valid; continue to Step 2 |
| **2** | `previousRedemptions` = [] | Empty list | Continue to Step 3 |
| **3** | `orderTimestamp` (Oct 16) vs `validUntilUtc` (Oct 20) | Is Oct 16 >= Oct 20? False | Continue to Step 4 |
| **4** | `firstOrderOnly` = false, `customerOrderCount` = 0 | Is `firstOrderOnly` true? False | Continue to Step 5 |
| **5** | `orderSubtotalMinor` (20000) vs `minSubtotalMinor` (5000) | Is 20000 < 5000? False | Continue to Step 6 |
| **6a**| `discountType` = "percent" | Is type "percent"? True | Calculate percentage |
| **6b**| `discountValue` = 25, `orderSubtotalMinor` = 20000 | 20000 * (25 / 100) = 5000 | `percentageDiscount` = 5000 ($50.00) |
| **6c**| `maxDiscountMinor` = 3000 | Is 5000 > 3000? **True** | Clamped to cap: `rawDiscount` = 3000 |
| **7** | `rawDiscount` (3000) vs `orderSubtotalMinor` (20000) | Is 3000 > 20000? False | `finalDiscount` = 3000 |
| **8** | Return final output | Return `finalDiscount` | **RETURN 3000** |

**Predicted Output:** `3000` minor units ($30.00 capped discount).

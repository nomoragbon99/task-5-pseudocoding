# Part C: Word-for-Word Spoken Explanation Script (4 Minutes)

**Context:** Explaining the Promotional Checkout Discount Engine to a fellow engineer using only pseudocode principles, business invariants, and logical decision gates—with zero programming language syntax and no code editor visible on screen.

---

### [0:00 - 0:45] Introduction and Core Invariants
"Hey! Let me walk you through how our promotional checkout discount engine works under the hood. 

Before we look at the calculations, there is one non-negotiable rule that governs the entire routine: **an order total can never, under any circumstances, drop below zero.** No matter what promotional code a customer applies, our business cannot end up paying the customer to buy goods.

To enforce this, we take an incoming order and evaluate it against a promotional code through a sequence of strict gate checks. If any gate fails, the discount is immediately rejected with a value of zero. If all gates pass, we calculate the discount and clamp it safely."

---

### [0:45 - 1:45] The Gatekeeper Checks (Early Exits)
"Think of the first phase as a security checkpoint with four consecutive gates:

1. **Gate One is Single-Use Enforcement:** We look at who is placing the order and check our list of past redemptions for this promotional code. If that customer’s identifier is already on that list, we exit immediately with zero discount.
2. **Gate Two is Expiration:** We compare the order submission timestamp against the promo code’s expiration deadline. If the order was placed at or after the expiration cutoff, the code has expired. We exit with zero discount.
3. **Gate Three is New Customer Protection:** Some promotions are reserved strictly for new shoppers. If the promotion has its first-order flag enabled, we verify that the customer’s prior order count is exactly zero. If they have even one previous order, we exit with zero discount.
4. **Gate Four is the Minimum Spend Threshold:** A promotion might say 'take ten dollars off, but only if you spend at least fifty.' We check the order subtotal. If the subtotal is strictly less than the required minimum spend, the order does not qualify, and we exit with zero discount."

---

### [1:45 - 2:45] The Happy Path: Computing the Discount
"If an order makes it through all four security gates, we reach the calculation phase. We support two distinct calculation modes:

- **First is Fixed Reductions:** This is straightforward. If the promo says five dollars off, the raw discount is simply five dollars.
- **Second is Percentage Reductions:** Here, we take the percentage rate—say, twenty percent—convert it to a fraction, multiply it by the eligible subtotal, and round to the nearest whole cent. 
  
  Now, here is a critical edge case: percentage discounts can specify a ceiling cap, such as 'twenty percent off up to a maximum of thirty dollars.' If a cap is configured and our calculated percentage exceeds that cap, we forcibly pull the discount down to the cap limit."

---

### [2:45 - 3:30] Clamping and Preventing Invariants Violations
"Once we have that raw discount number, we arrive at our final safety clamp.

Imagine a customer has an order subtotal of fifteen dollars, but they applied a thirty-dollar fixed promotional credit. If we subtracted thirty from fifteen, the customer's balance would become negative fifteen dollars. 

To prevent this, our final step compares the raw discount against the order subtotal. If the discount is greater than the subtotal, we clamp the discount down so that it matches the subtotal exactly. The customer pays zero dollars, the balance never turns negative, and we return the clamped discount in minor currency units."

---

### [3:30 - 4:00] Summary & Failure Modes
"To recap:
- Invalid inputs—like negative order totals, negative spend thresholds, or unrecognized discount types—immediately abort with descriptive validation errors.
- Disqualified orders cleanly and silently receive a discount of zero.
- Qualified orders calculate percentage or fixed amounts with ceiling caps.
- Final clamping guarantees the order total never drops below zero.

That's the entire engine: simple, predictable, and structurally guarded against financial leakage."

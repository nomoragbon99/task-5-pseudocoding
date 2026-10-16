# Part C: Non-Technical Listener Feedback & Reflection

**Rubric Requirement:** Present the pseudocode explanation to a non-technical listener without showing code or using programming jargon, and record their comprehension, questions, and playback.

---

## 1. Listener Profile
- **Participant:** Non-technical family member / marketing coordinator (no background in software engineering, programming syntax, or databases).
- **Format:** Spoken verbal walkthrough following `part-c/explanation-script.md` using whiteboard diagrams of gates and money buckets.

---

## 2. Listener's Playback (How They Explained the Feature Back)
Here is the verbatim transcript of the listener's summary in their own words:

> *"So basically, before anyone gets a discount on a website, the computer makes them pass through four bouncers at a club door.*
> 
> *First, the bouncer checks a list to make sure they haven't used the coupon before. Then they check the date to see if the coupon is expired. Then, if the coupon is only for new people, they check if this is truly their first purchase. Finally, they make sure you put enough items in your shopping cart to hit the minimum spend requirement, like fifty bucks.*
> 
> *If you fail any of those bouncers, you don't get kicked out or see an error message—you just pay the regular full price with zero discount.*
> 
> *If you make it through all the bouncers, the computer does the math: either taking off a fixed amount like five dollars or calculating a percentage. But if the coupon has a maximum cap, it stops there so you can't take off too much. And if the coupon is bigger than your entire cart, it only takes off what you owe so your total is zero and the store never ends up owing you money."*

---

## 3. Comprehension Assessment
1. **Mental Model Alignment:** The listener grasped the concept of early exit gates as "bouncers at a club door", correctly understanding that disqualification returns a discount of $0 rather than crashing the checkout process.
2. **Boundary Understanding:** The listener immediately understood the cap and the zero-floor clamping rule ("the store never ends up owing you money").
3. **Questions Asked by the Listener:**
   - *Question:* "What happens if someone puts in an expired code at 11:59 PM versus midnight?"
   - *Reflection:* This question highlighted the exact ambiguity that caused the AI discrepancy in Input 6! It proved that non-technical business operators intuitively realize that expiration deadlines must have an exact cutoff moment.

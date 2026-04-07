# ClassRide — Subscription Model

## 3 Tiers

| Plan | Buses | Students | AI Optimization | Price |
|---|---|---|---|---|
| Starter | 1 | up to 30 | ❌ Manual only | Free / Low cost |
| Growth | up to 5 | up to 150 | ✅ Included | Monthly fee |
| Pro | Unlimited | Unlimited | ✅ Included | Higher monthly fee |

---

## Database Tables Needed

Two tables to be added to the schema:

- `subscription_plans` — defines the tiers and limits
- `subscriptions` — tracks which plan each organization is on

---

## Logic

- Super Admin creates and manages plans
- Bus owner pays → subscription activated
- System enforces limits (can't add 6th bus on Starter plan)
- Expired subscription → organization suspended automatically
- Grace period before suspension

---

## Enforcement

Subscription middleware runs on every request:
1. Check if organization has an active subscription
2. Check if action would exceed plan limits
3. Block request if limit reached, return clear error message
4. Log attempted over-limit actions

---

*ClassRide — Built by Dana Amacha*

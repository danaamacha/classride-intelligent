# ClassRide — Payment System
# Last Updated: April 24, 2026

---

## Overview

ClassRide uses a **wallet/balance system** instead of per-trip payment tracking.
Each student has a running balance with their bus owner.
The driver collects cash and records it in the app — the system handles the math.

---

## Why a Wallet System?

In Lebanon, bus payments are cash-based and flexible:
- Students pay for both trips at once in the morning
- Sometimes a student pays late (next day, on the street)
- Sometimes a student misses the return trip but already paid for it
- Students need to track what they owe or have as credit

A simple `paid: true/false` per trip can't handle these cases.
A wallet with a running balance handles all of them.

---

## Database Tables

### StudentBalance
```
studentPhone  ← which student
ownerPhone    ← which owner (one balance per owner)
balance       ← running total (positive = credit, negative = owes)
updatedAt     ← last update time
```

### BalanceTransaction
```
studentPhone  ← which student
ownerPhone    ← which owner
amount        ← positive = payment, negative = deduction
type          ← PAYMENT | DEDUCTION | LATER
tripId        ← which trip (nullable for street payments)
note          ← description
createdAt     ← when it happened
```

### Payment (per-trip record)
```
tripId        ← which trip
studentPhone  ← which student
amountPaid    ← how much driver collected for this trip
note          ← optional note
createdAt     ← when recorded
```

### Owner.pricePerTrip
```
Set by owner (e.g. 300,000 LBP)
Used as the deduction amount per trip attended
```

---

## How It Works — Step by Step

### 1. Owner sets price
Owner goes to Dashboard → sets `pricePerTrip = 300,000 LBP`
This is the cost of one trip (morning OR return).

### 2. Trip happens
Driver picks up students and drives to destination.

### 3. Driver records payment (during or after trip)
For each student, driver taps one of:

| Button | What it means | Balance effect |
|---|---|---|
| 300k | Paid for this trip only | +300,000 payment, -300,000 deduction = net 0 |
| 500k | Paid for both trips today | +500,000 payment, -300,000 deduction (morning) = +200,000 credit |
| ✏️ Custom | Any amount | +X payment, -300,000 deduction |
| ⏰ Later | Attended but didn't pay | 0 payment, -300,000 deduction = -300,000 owes |
| (no tap) | Didn't board | No deduction, no payment |

### 4. If student paid 500k (both trips)
System finds the return trip same day for same student
and auto-records a -300,000 deduction for it too.

### 5. Balance carries forward
If student owes 300,000 → balance stays -300,000
Next day driver sees it and can collect then.

---

## Real-Life Scenarios

### Scenario A — Normal day, paid for both
```
Student pays 500,000 LBP in the morning
Driver taps [500k]

Transactions:
  💵 +500,000  Payment received
  🚌 -300,000  Morning trip deduction
  🚌 -300,000  Return trip deduction (auto)

Balance: 0 ✅
```

### Scenario B — Paid for morning only
```
Student pays 300,000 LBP
Driver taps [300k]

Transactions:
  💵 +300,000  Payment received
  🚌 -300,000  Morning trip deduction

Balance: 0 ✅
(Return trip not paid yet — driver will collect separately)
```

### Scenario C — Paid for both but missed return
```
Student pays 500,000 LBP in morning
Driver taps [500k]
Student misses return trip → driver doesn't tap anything for return

Transactions:
  💵 +500,000  Payment received
  🚌 -300,000  Morning trip deduction
  (no return deduction — student wasn't on the bus)

Balance: +200,000 🟡 credit
(Carries to tomorrow — student effectively prepaid)
```

### Scenario D — Didn't pay today, pays double tomorrow
```
Day 1: Student attended both trips, paid nothing
  Transactions:
    ⏰  0        Will pay later (morning)
    🚌 -300,000  Morning deduction
    🚌 -300,000  Return deduction
  Balance: -600,000 🔴

Day 2: Student gives driver 600,000 on the street
  Driver opens Payments tab → finds student → taps [custom: 600,000]
  Transactions:
    💵 +600,000  Payment received
    🚌 -300,000  Morning deduction (Day 2)
    🚌 -300,000  Return deduction (Day 2)
  Balance: 0 ✅
```

### Scenario E — Partial payment
```
Student pays 200,000 (only has that much)
Driver taps [custom: 200,000]

Transactions:
  💵 +200,000  Payment received
  🚌 -300,000  Trip deduction

Balance: -100,000 🔴 (still owes 100k)
```

---

## Driver Flow

### During/After Trip
Trip screen → per student:
```
👤 John Doe — Hamra
[300k]  [500k]  [✏️]  [⏰]
```

### Payments Tab (anytime)
Shows ALL students sorted by who owes most:
```
⚠️ Owes:
  John Doe    -600,000 🔴  [+ Add Payment]
  Sara Khalil -300,000 🔴  [+ Add Payment]

✅ Settled:
  Rami Hassan  0 ✅
  Lara Mrad   +200,000 🟡
```

Tap student → full transaction history
Tap [+ Add Payment] → enter any amount

### Correcting a Mistake
If driver tapped wrong amount:
- Go to student transaction history
- Tap the transaction → edit amount or delete it
- Balance auto-corrects

---

## Student View

Student sees in Profile tab → Balance card:
```
💰 My Balance
+200,000 LBP 🟡 You have credit
[Tap to view history]
```

Transaction history modal:
```
Apr 24 💵 Payment received      +500,000
Apr 24 🚌 Morning trip → AUB    -300,000
Apr 24 🚌 Return trip → AUB     -300,000
────────────────────────────────
Balance: -100,000 🔴
```

Student can verify every deduction — full transparency.

---

## API Reference

| Endpoint | Role | Description |
|---|---|---|
| POST /payments/record | driver | Record payment for a student |
| GET /payments/students | driver | All students + balances |
| GET /payments/my/balance | student | Own balance + history |
| PUT /payments/price | owner | Set price per trip |
| GET /payments/price | any | Get current price |
| PUT /payments/transaction/:id | driver | Edit a transaction |
| DELETE /payments/transaction/:id | driver | Delete a transaction |
| GET /payments/owner/balances | owner | All student balances |

---

## Key Design Decisions

1. **No auto-deduction from attendance** — attendance can be wrong (student marked present but didn't board). Only driver's explicit payment tap triggers deductions.

2. **Payment = proof of attendance** — if driver tapped a payment button for a student, that student was on the bus. No separate attendance marking needed.

3. **Balance is per student per owner** — if a student switches buses, their balance with the old owner stays separate.

4. **tripId is nullable** — allows recording payments outside of any specific trip (street payments, catch-up payments).

5. **Negative balance is valid** — student owes money, carries forward indefinitely until paid.

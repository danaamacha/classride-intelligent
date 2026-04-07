# ClassRide — User Roles

There are 4 roles in the platform.

---

## 1. SUPER_ADMIN
> Dana — the platform owner

- Approves bus owner registrations
- Manages subscription plans
- Monitors the entire platform
- Sees all organizations and activity
- Suspends / activates any account
- Has NO organization (`organizationId = null`)

---

## 2. BUS_OWNER

- Registers organization on ClassRide
- Pays monthly subscription
- Adds their buses and plate numbers
- Assigns drivers to buses
- Manually adds students to routes
- Approves / rejects student join requests
- Triggers AI route optimization
- Monitors trips in real time
- Tracks attendance per student
- Tracks cash payments per student
- Views reports and trip history

---

## 3. DRIVER

- Logs into the driver mobile app
- Sees assigned bus and route
- Sees ordered list of students to pick up
- Marks each student as picked up or absent
- Confirms cash payment received
- Starts and completes trip
- Views trip history

---

## 4. STUDENT

- Downloads the mobile app
- Registers with exact home address
- Sends join request to bus owner
- Gets notified when approved
- Sees assigned bus and pickup time
- Sees their stop order in the route
- Views trip schedule (morning / evening)
- Can mark themselves absent for a day

---

*ClassRide — Built by Dana Amacha*

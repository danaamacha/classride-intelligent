# ClassRide — API Endpoints Reference
# Last Updated: April 24, 2026

---

## Base URL
- Development: `http://192.168.1.103:3001`
- Production: TBD (Railway)

## Authentication
All protected routes require:
```
Authorization: Bearer <access_token>
```

---

## 🔐 AUTH

### POST /auth/register
**Role:** Public
**Body:**
```json
{
  "phoneNumber": "70111222",
  "fullName": "John Doe",
  "password": "abc123"
}
```
**Response:** `{ message, user }`

---

### POST /auth/login
**Role:** Public
**Body:**
```json
{
  "phoneNumber": "70111222",
  "password": "abc123"
}
```
**Response:** `{ accessToken, refreshToken, user }`

---

### POST /auth/refresh
**Role:** Public
**Body:**
```json
{ "refreshToken": "..." }
```
**Response:** `{ accessToken, refreshToken }`

---

### POST /auth/logout
**Role:** Any authenticated
**Body:** none
**Response:** `{ message }`

---

### GET /auth/me
**Role:** Any authenticated
**Response:** `{ phoneNumber, fullName, role, owner/driver/student }`

---

## 🏢 OWNER

### GET /owner/list
**Role:** Public
**Description:** List all accepted owners (for student join request)
**Response:** `[{ phoneNumber, user: { fullName } }]`

---

### GET /owner/dashboard
**Role:** owner
**Response:**
```json
{
  "owner": { "fullName", "phoneNumber" },
  "stats": {
    "totalBuses", "totalDrivers", "totalStudents",
    "pendingJoinRequests", "unreadNotifications", "todayTrips"
  },
  "todayTrips": [...],
  "recentNotifications": [...]
}
```

---

### GET /owner/admin/all
**Role:** admin
**Response:** All owners with student/driver/bus counts

---

### GET /owner/admin/pending
**Role:** admin
**Response:** Owners with status = pending

---

### PUT /owner/admin/:phone/approve
**Role:** admin
**Response:** `{ message }`

---

### PUT /owner/admin/:phone/reject
**Role:** admin
**Response:** `{ message }`

---

## 🚌 BUSES

### POST /buses
**Role:** owner
**Body:**
```json
{
  "busName": "Bus 1",
  "capacity": 30
}
```
**Response:** Created bus object

---

### GET /buses
**Role:** owner
**Response:** `[{ busId, busName, capacity, ownerPhone }]`

---

### DELETE /buses/:id
**Role:** owner
**Response:** `{ message }`

---

## 👨‍✈️ DRIVERS

### POST /driver
**Role:** owner
**Body:**
```json
{
  "phoneNumber": "70999888",
  "fullName": "Ali Hassan",
  "homeTown": "Beirut"
}
```
**Response:** `{ ...driver, generatedPassword }`

---

### GET /driver
**Role:** owner
**Response:** All drivers under this owner

---

### DELETE /driver/:phoneNumber
**Role:** owner
**Response:** `{ message }`

---

### GET /driver/trips
**Role:** driver
**Response:** Scheduled + active trips with student list + payments

---

### GET /driver/trips/active
**Role:** driver
**Response:** Current active trip with students

---

### GET /driver/trips/completed
**Role:** driver
**Response:** All completed trips

---

### PUT /driver/trips/:id/activate
**Role:** driver
**Response:** Updated trip (status → active)

---

### PUT /driver/trips/:id/complete
**Role:** driver
**Response:** Updated trip (status → completed)

---

## 🎓 STUDENTS

### POST /students
**Role:** owner
**Body:**
```json
{
  "phoneNumber": "70111222",
  "fullName": "Sara Khalil",
  "homeAddress": "Hamra, Beirut",
  "destinationId": 1
}
```
**Response:** `{ ...student, generatedPassword }`

---

### GET /students
**Role:** owner
**Response:** All students under this owner with user + destination info

---

### DELETE /students/:phoneNumber
**Role:** owner
**Response:** `{ message }`

---

### GET /students/join-requests
**Role:** owner
**Response:** Pending join requests with student details + schedule

---

### POST /students/join-requests/accept
**Role:** owner
**Body:** `{ "studentPhone": "70111222" }`
**Response:** `{ message }`
**Side effects:** Student role → student, notification sent

---

### POST /students/join-requests/reject
**Role:** owner
**Body:** `{ "studentPhone": "70111222" }`
**Response:** `{ message }`
**Side effects:** Notification sent to student

---

### POST /students/join-request
**Role:** student/pending
**Body:**
```json
{
  "ownerPhone": "70123456",
  "homeAddress": "Hamra, Beirut",
  "university": "AUB",
  "schedule": [
    { "day_of_week": 1, "morning_time": "07:00", "return_time": "17:00" }
  ]
}
```
**Response:** `{ message }`

---

### GET /students/my/trips
**Role:** student
**Response:** All assigned trips with bus + destination + driver info

---

### GET /students/my/trips/active
**Role:** student
**Response:** Current active trip

---

### GET /students/my/schedule
**Role:** student
**Response:** Weekly schedule array

---

### POST /students/my/schedule
**Role:** student
**Body:**
```json
{
  "day_of_week": 1,
  "morning_time": "07:00",
  "return_time": "17:00",
  "attendance_morning": true,
  "attendance_return": true
}
```
**Response:** Upserted schedule record

---

### DELETE /students/my/schedule/:day
**Role:** student
**Response:** `{ message }`

---

### GET /students/my/attendance
**Role:** student
**Response:**
```json
{
  "today": {
    "date", "morningTime", "returnTime",
    "attendanceMorning", "attendanceReturn", "source"
  },
  "tomorrow": { ... }
}
```

---

### PUT /students/my/attendance
**Role:** student
**Body:**
```json
{
  "date": "2026-04-24",
  "attendanceMorning": true,
  "attendanceReturn": false,
  "overrideMorningTime": "08:00",
  "overrideReturnTime": null
}
```
**Response:** Updated attendance (same as GET)
**Side effects:**
- Absent → removed from trip, owner notified
- Present but no trip → owner notified
- Return time changed → auto-reassignment attempted

---

### PUT /students/my/profile
**Role:** student
**Body:** `{ "homeAddress": "New address" }`
**Response:** `{ message }`

---

### GET /students/my/request
**Role:** student/pending
**Response:** `{ ownerPhone, ownerName, status, reqDate }`

---

## 🗺️ DESTINATIONS

### POST /destinations
**Role:** owner
**Body:** `{ "name": "AUB", "location": "Bliss Street" }`
**Response:** Created destination

---

### GET /destinations
**Role:** owner
**Response:** All destinations under this owner

---

### DELETE /destinations/:id
**Role:** owner
**Response:** `{ message }`

---

## 🚐 TRIPS

### POST /trips
**Role:** owner
**Body:**
```json
{
  "busId": 1,
  "driverPhone": "70999888",
  "destinationId": 1,
  "pickupTime": "07:00",
  "dropoffTime": "08:30",
  "type": "morning",
  "date": "2026-04-24"
}
```
**Response:** Created trip
**Side effects:** Driver notified

---

### GET /trips
**Role:** owner
**Response:** All trips with bus + driver + destination

---

### GET /trips/:id
**Role:** owner
**Response:** Trip detail with assigned students + payments + balances

---

### PUT /trips/:id
**Role:** owner
**Body:** Any subset of trip fields (partial update)
**Response:** Updated trip
**Side effects:** If driver changed → new driver notified

---

### PUT /trips/:id/status
**Role:** owner
**Body:** `{ "status": "active" | "completed" | "scheduled" }`
**Response:** Updated trip
**Side effects:**
- active → all assigned students notified
- completed → owner notified

---

### DELETE /trips/:id
**Role:** owner
**Response:** `{ message }`
**Side effects:** Assignments + payments + transactions deleted

---

### POST /trips/:id/assign
**Role:** owner
**Body:** `{ "studentPhone": "70111222" }`
**Response:** Created assignment
**Side effects:** Student notified

---

### DELETE /trips/:id/assign/:studentPhone
**Role:** owner
**Response:** `{ message }`

---

## 💰 PAYMENTS (WALLET SYSTEM)

### GET /payments/students
**Role:** driver
**Description:** All students under same owner with current balance
**Response:**
```json
[{
  "phoneNumber", "fullName", "homeAddress",
  "destination", "balance"
}]
```

---

### POST /payments/record
**Role:** driver
**Body:**
```json
{
  "tripId": 1,
  "studentPhone": "70111222",
  "amountPaid": 300000,
  "note": "Paid for morning trip"
}
```
**Notes:**
- `amountPaid: 0` = marked as "Later" (attended, will pay)
- `tripId: null` = payment outside of trip context
- If amountPaid >= 2x pricePerTrip → return trip auto-covered
**Response:** `{ message, balance }`
**Side effects:** Student notified, balance updated, transactions recorded

---

### GET /payments/trip/:tripId
**Role:** driver
**Response:** All payments for that trip with student info

---

### GET /payments/student/:studentPhone
**Role:** driver
**Response:** Student balance + info

---

### GET /payments/my/balance
**Role:** student
**Response:**
```json
{
  "balance": -300000,
  "transactions": [{
    "id", "amount", "type", "note", "createdAt",
    "trip": { "date", "type", "destination": { "name" } }
  }]
}
```

---

### PUT /payments/price
**Role:** owner
**Body:** `{ "pricePerTrip": 300000 }`
**Response:** `{ message, pricePerTrip }`

---

### GET /payments/price
**Role:** owner/driver
**Response:** `{ pricePerTrip }`

---

### PUT /payments/transaction/:id
**Role:** driver
**Body:** `{ "amount": 500000, "note": "Corrected amount" }`
**Response:** `{ message, balance }`

---

### DELETE /payments/transaction/:id
**Role:** driver
**Response:** `{ message }`
**Side effects:** Amount reversed from student balance

---

### GET /payments/owner/balances
**Role:** owner
**Response:** All students sorted by balance (owes most first)
```json
[{
  "phoneNumber", "fullName", "destination", "balance"
}]
```

---

## 🔔 NOTIFICATIONS

### GET /notifications
**Role:** Any authenticated
**Response:** All notifications for current user (newest first)

---

### GET /notifications/unread
**Role:** Any authenticated
**Response:** Unread notifications only

---

### GET /notifications/unread/count
**Role:** Any authenticated
**Response:** `{ count: 3 }`

---

### PUT /notifications/read-all
**Role:** Any authenticated
**Response:** `{ message }`

---

### PUT /notifications/:id/read
**Role:** Any authenticated
**Response:** Updated notification

---

## 🔴 ERROR RESPONSES

All errors follow this format:
```json
{
  "statusCode": 404,
  "message": "Student not found",
  "error": "Not Found"
}
```

Common status codes:
- `400` — Bad request / validation error
- `401` — Not authenticated
- `403` — Not authorized (wrong role)
- `404` — Resource not found
- `409` — Conflict (duplicate)
- `500` — Server error

# ClassRide — Mobile Screens Reference
# Last Updated: April 24, 2026

---

## Tech Stack
- React Native + Expo
- Navigation: @react-navigation/native + bottom-tabs + native-stack
- HTTP: Axios (via api.ts service)
- Auth: JWT stored in AsyncStorage via AuthContext

---

## Navigation Structure

```
AppNavigator (Stack)
│
├── (no user) ──→ Login, Register
│
├── role = owner ──→ OwnerTabNavigator (4 tabs)
│   ├── Dashboard
│   ├── Buses
│   ├── Students
│   └── Trips
│   + Stack: Notifications, TripDetail
│
├── role = driver ──→ DriverTabNavigator (2 tabs)
│   ├── Trips
│   └── Payments
│   + Stack: Notifications
│
└── role = student/pending ──→ StudentTabNavigator (3 tabs)
    ├── My Trips
    ├── Daily
    └── Profile
    + Stack: JoinRequest, Notifications, StudentProfile
```

---

## AUTH SCREENS

### LoginScreen
**File:** `src/screens/auth/LoginScreen.tsx`
**Route:** Stack — shown when no user
**API calls:**
- POST /auth/login
**Features:**
- Phone + password login
- Navigates to RegisterScreen
- On login → AuthContext stores user + tokens
- Role-based navigation handled by AppNavigator

---

### RegisterScreen
**File:** `src/screens/auth/RegisterScreen.tsx`
**Route:** Stack
**API calls:**
- POST /auth/register
**Features:**
- Phone, full name, password fields
- On success → navigates to Login

---

## STUDENT SCREENS

### StudentHomeScreen (My Trips tab)
**File:** `src/screens/student/StudentHomeScreen.tsx`
**Tab:** My Trips
**API calls:**
- GET /students/my/trips
- GET /students/my/request (if role = pending)
- GET /notifications/unread/count
**Features:**
- Shows assigned trips list (bus, destination, time, date)
- Pending users: shows request status card with owner name
- Notification bell with unread badge
- "Find a Bus" button → navigates to JoinRequest
- Pull to refresh

---

### StudentDailyScreen (Daily tab)
**File:** `src/screens/student/StudentDailyScreen.tsx`
**Tab:** Daily
**API calls:**
- GET /students/my/attendance
- PUT /students/my/attendance
**Features:**
- Shows today + tomorrow attendance cards
- Toggle morning/return attendance
- Override pickup time (time picker)
- Override return time (time picker)
- Smart logic: if matches weekly schedule → deletes override
- Source badge (weekly vs override)
- Side effects on backend:
  - Absent → removed from trip, owner notified
  - Present but no trip assigned → owner notified
  - Return time changed → auto-reassignment attempted

---

### StudentProfileScreen (Profile tab)
**File:** `src/screens/student/StudentProfileScreen.tsx`
**Tab:** Profile
**API calls:**
- GET /auth/me
- PUT /students/my/profile
- GET /payments/my/balance
- GET /students/my/schedule
- POST /students/my/schedule
- DELETE /students/my/schedule/:day
**Features:**
- User info card (name, phone, role badge)
- Home address edit + save
- Balance card (color-coded: green/yellow/red)
  - Tap → transaction history modal
- Weekly schedule section:
  - List of scheduled days with times + attendance badges
  - Edit day modal (times + morning/return toggles)
  - Add day chips (available days only)
  - Delete day with confirmation
- Pending users: info box explaining status
- Logout button

---

### StudentJoinRequestScreen
**File:** `src/screens/student/StudentJoinRequestScreen.tsx`
**Route:** Stack (from StudentHome "Find a Bus" button)
**API calls:**
- GET /owner/list
- POST /students/join-request
**Features:**
- List of available owners to join
- Select owner → fill home address + university
- Add weekly schedule (days, morning time, return time)
- Submit request

---

## DRIVER SCREENS

### DriverTripsScreen (Trips tab)
**File:** `src/screens/driver/DriverTripsScreen.tsx`
**Tab:** My Trips
**API calls:**
- GET /driver/trips
- GET /driver/trips/active
- GET /notifications/unread/count
- GET /payments/price
- POST /payments/record
- PUT /driver/trips/:id/activate
- PUT /driver/trips/:id/complete
**Features:**
- Active trip card (green border):
  - Trip info (destination, bus, time, type, date)
  - Price legend (300k = 1 trip, 600k = both)
  - Student list with payment buttons per student:
    - [300k] — single trip payment
    - [500k/600k] — both trips payment
    - [✏️] — custom amount modal
    - [⏰] — later (attended, will pay)
    - Shows paid badge with amount if already recorded
    - Shows "Later" badge if marked later
    - Edit button on existing payments
  - Complete Trip button
- Scheduled trips list:
  - Trip info cards
  - Student list preview
  - Start Trip button
- Notification bell with badge
- Custom amount modal:
  - Number input
  - Quick amount buttons (300k, 600k, 900k)
  - Confirm button
- Pull to refresh

---

### DriverPaymentsScreen (Payments tab)
**File:** `src/screens/driver/DriverPaymentsScreen.tsx`
**Tab:** Payments
**API calls:**
- GET /payments/students
- GET /payments/price
- POST /payments/record
- GET /payments/student/:phone (for history)
**Features:**
- Students split into two sections:
  - ⚠️ Owes Payment (balance < 0) — shown first
  - ✅ Settled (balance >= 0)
- Per student card:
  - Name, address, destination
  - Color-coded balance badge (red/yellow/green)
  - Tap card → transaction history modal
  - [+ Add Payment] button
- Add Payment modal:
  - Current balance display
  - Amount input
  - Quick amounts (300k, 600k, 900k, 1.2M)
  - Confirm button
- Transaction history modal:
  - Balance summary
  - Full transaction list (type, trip info, date, amount)
  - [+ Add Payment] button at bottom
- Pull to refresh

---

## OWNER SCREENS

### OwnerDashboardScreen
**File:** `src/screens/owner/OwnerDashboardScreen.tsx`
**Tab:** Dashboard
**API calls:**
- GET /owner/dashboard
- GET /notifications/unread/count
- GET /payments/price
- PUT /payments/price
**Features:**
- Stats grid (buses, drivers, students, requests, unread, today)
- Today's trips list with status badges
- Trip price setting card (current price + edit input)
- Notification bell with badge
- Logout button
- Pull to refresh

---

### OwnerBusesScreen
**File:** `src/screens/owner/OwnerBusesScreen.tsx`
**Tab:** Buses
**API calls:**
- GET /buses
- POST /buses
- DELETE /buses/:id
**Features:**
- Bus list with name + capacity
- Add bus modal (name + capacity)
- Delete bus with confirmation

---

### OwnerStudentsScreen
**File:** `src/screens/owner/OwnerStudentsScreen.tsx`
**Tab:** Students
**API calls:**
- GET /students
- POST /students
- DELETE /students/:phoneNumber
- GET /students/join-requests
- POST /students/join-requests/accept
- POST /students/join-requests/reject
**Features:**
- Two tabs: Students list + Join Requests
- Students list: name, phone, address, destination
- Add student modal
- Delete student with confirmation
- Join requests: student details + schedule preview
- Accept/Reject buttons per request

---

### OwnerTripsScreen
**File:** `src/screens/owner/OwnerTripsScreen.tsx`
**Tab:** Trips
**API calls:**
- GET /trips
**Features:**
- Trip list with destination, type, date, status badge
- Tap trip → navigates to TripDetail

---

### OwnerTripDetailScreen
**File:** `src/screens/owner/OwnerTripDetailScreen.tsx`
**Route:** Stack (from OwnerTrips)
**API calls:**
- GET /trips/:id
- DELETE /trips/:id/assign/:studentPhone
**Features:**
- Trip info (destination, bus, driver, time, date, type, status)
- Assigned students list:
  - Name + address
  - Payment amount badge
  - Unassign button (only for scheduled trips)
- Back button

---

## SHARED SCREENS

### NotificationsScreen
**File:** `src/screens/shared/NotificationsScreen.tsx`
**Route:** Stack (all roles)
**API calls:**
- GET /notifications
- PUT /notifications/:id/read
- PUT /notifications/read-all
**Features:**
- Notification list (newest first)
- Unread notifications highlighted with blue border
- Tap notification → marks as read
- Mark All Read button
- Type badges (join_request, attendance, payment, trip, info)
- Empty state

---

## SHARED SERVICES

### api.ts
**File:** `src/services/api.ts`
- Axios instance with base URL
- Auth interceptor: adds Bearer token to every request
- Refresh interceptor: auto-refreshes on 401

### AuthContext
**File:** `src/context/AuthContext.tsx`
- Stores user + tokens in AsyncStorage
- Provides: user, isLoading, login(), logout()
- Role-based navigation in AppNavigator

---

## Color Scheme

| Role | Primary Color |
|---|---|
| Owner | #2563EB (blue) |
| Driver | #7C3AED (purple) |
| Student | #059669 (green) |

---

## Key Patterns

1. **Pull to refresh** — all list screens support pull-to-refresh
2. **Loading states** — ActivityIndicator while fetching
3. **Empty states** — friendly message when no data
4. **Alert confirmations** — destructive actions always confirm first
5. **Optimistic UI** — payment buttons show result immediately
6. **Bottom sheet modals** — all forms use slide-up modals

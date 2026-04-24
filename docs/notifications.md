# ClassRide — Notifications System
# Last Updated: April 24, 2026

---

## Overview

ClassRide uses an in-app notification system stored in PostgreSQL.
Every important action triggers a notification to the relevant user.
Notifications appear in a bell icon with an unread count badge.

---

## Database Table

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userPhone String   ← who receives this notification
  title     String?  ← short heading
  body      String?  ← full message
  type      String?  ← category (see types below)
  isRead    Boolean  @default(false)
  metadata  Json?    ← optional extra data
  createdAt DateTime @default(now())
}
```

---

## Notification Types

| Type | Used For |
|---|---|
| `join_request` | Student sent/accepted/rejected join request |
| `attendance` | Student marked absent, attending but unassigned, auto-reassigned |
| `payment` | Payment recorded, balance updated |
| `trip` | Trip assigned to driver, student assigned to trip, trip started, trip completed |
| `info` | General information, schedule updates |

---

## Complete Notification Triggers

### 👤 Join Request Flow

| Event | Who gets notified | Title | Body |
|---|---|---|---|
| Student sends join request | Owner | 📥 New Join Request | "{name} from {address} wants to join your bus to {university}" |
| Owner accepts request | Student | 🎉 Join Request Accepted! | "Your join request has been accepted. Welcome aboard!" |
| Owner rejects request | Student | ❌ Request Rejected | "Your join request was rejected. You may try another bus owner." |

---

### 🚐 Trip Flow

| Event | Who gets notified | Title | Body |
|---|---|---|---|
| Owner creates trip | Driver | 🚌 New Trip Assigned | "You have a new {type} trip to {destination} on {date} at {time}" |
| Owner changes driver on trip | New driver | 🚌 Trip Assigned to You | "You have been assigned a trip to {destination} on {date}" |
| Owner assigns student to trip | Student | 🎉 Assigned to a Trip! | "You've been assigned to a {type} trip to {destination} on {date}" |
| Trip status → active | All assigned students | 🚌 Your Bus is On The Way! | "Your {type} trip to {destination} has started" |
| Trip status → completed | Owner | ✅ Trip Completed | "{type} trip to {destination} has been completed" |

---

### 📅 Attendance Flow

| Event | Who gets notified | Title | Body |
|---|---|---|---|
| Student marks absent (morning) | Owner | 📅 Attendance Update | "{name} marked absent for morning on {date}" |
| Student marks absent (return) | Owner | 📅 Attendance Update | "{name} marked absent for return on {date}" |
| Student marks present but no trip assigned (morning) | Owner | 📅 Student Unassigned | "{name} is attending morning on {date} but has no trip assigned" |
| Student marks present but no trip assigned (return) | Owner | 📅 Student Unassigned | "{name} is attending return on {date} but has no trip assigned" |
| Return time changed → student auto-reassigned | Owner | 🔄 Student Reassigned | "{name} was auto-reassigned to a return trip on {date}" |

---

### 💰 Payment Flow

| Event | Who gets notified | Title | Body |
|---|---|---|---|
| Driver records payment (amount > 0) | Student | 💰 Payment Recorded | "Driver recorded {amount} LBP. Balance: {balance} LBP" |
| Driver records "Later" (amount = 0) | Student | ⏰ Payment Pending | "Your trip was recorded. Balance: {balance} LBP" |

---

### 📆 Schedule Flow

| Event | Who gets notified | Title | Body |
|---|---|---|---|
| Student updates weekly schedule | Owner | 📅 Schedule Update | "{name} updated their weekly schedule" |

---

## API Endpoints

### GET /notifications
Returns all notifications for the authenticated user, newest first.
```json
[{
  "id": 1,
  "userPhone": "70111222",
  "title": "🎉 Join Request Accepted!",
  "body": "Your join request has been accepted. Welcome aboard!",
  "type": "join_request",
  "isRead": false,
  "createdAt": "2026-04-24T10:30:00Z"
}]
```

### GET /notifications/unread
Returns only unread notifications.

### GET /notifications/unread/count
```json
{ "count": 3 }
```

### PUT /notifications/read-all
Marks all notifications as read for current user.

### PUT /notifications/:id/read
Marks a single notification as read.

---

## NotificationsService

Located at `src/notifications/notifications.service.ts`

```typescript
// Used throughout the app like this:
await this.notifications.create({
  userPhone: recipientPhone,
  title: '🎉 Title here',
  body: 'Message body here',
  type: 'join_request',
});
```

The service is injected into:
- StudentsService (join request + attendance)
- TripsService (trip assignment + status changes)
- PaymentsService (payment recorded)

---

## Mobile Implementation

### Bell Icon (all roles)
Every main screen header has a bell button:
```
🔔 (badge with unread count)
```
Tapping navigates to NotificationsScreen.

Unread count is fetched on every screen load via:
```
GET /notifications/unread/count
```

### NotificationsScreen
- Lists all notifications newest first
- Unread: highlighted with blue left border
- Tap any notification → marks as read (PUT /notifications/:id/read)
- "Mark All Read" button at top
- Type-based emoji badges

---

## Future Enhancements (Not Built Yet)

### FCM Push Notifications
- Send push to device even when app is closed
- Requires Firebase Cloud Messaging setup
- FCM token stored in `User.fcmToken` field (already in schema)
- Currently: DB notification only (in-app bell)

### WhatsApp Notifications
- Send WhatsApp message when student is accepted
- Common in Lebanon — users trust WhatsApp
- Requires Twilio or WhatsApp Business API

---

## Design Decisions

1. **DB-based not push-based** — simpler, works offline, no Firebase setup needed for MVP
2. **FCM token field ready** — schema has `fcmToken` on User model, ready when we add push
3. **Type field** — allows filtering by category in future
4. **Metadata JSON field** — flexible for adding context (e.g. tripId, requestId) without schema changes
5. **Never delete notifications** — mark as read only, keep full history

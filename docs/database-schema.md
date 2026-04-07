# ClassRide — Database Schema (v2)

9 tables total. Built on PostgreSQL via Supabase. ORM: Prisma.

---

## Tables

### 1. organizations
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| name, email, phone, address, logo_url | string | |
| is_active | boolean | can be suspended |
| is_approved | boolean | Super Admin must approve |
| created_at, updated_at | timestamp | |

---

### 2. users
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| email | unique string | |
| password | bcrypt hash ONLY | never plain text |
| first_name, last_name, phone | string | |
| role | ENUM | STUDENT, DRIVER, BUS_OWNER, SUPER_ADMIN |
| is_active | boolean | |
| organization_id | FK → organizations | NULL for Super Admin |
| home_address, home_lat, home_lng | string / float | students only |
| university | string | student destination |
| created_at, updated_at | timestamp | |

---

### 3. buses
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| organization_id | FK → organizations | |
| plate_number | unique string | |
| model, capacity | string / int | |
| is_active | boolean | |
| driver_id | FK → users, unique | one driver per bus |
| created_at, updated_at | timestamp | |

---

### 4. routes
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| organization_id | FK → organizations | |
| bus_id | FK → buses | |
| name | string | e.g. "Morning Route - AUB" |
| trip_type | ENUM | MORNING, EVENING |
| destination | string | university name |
| destination_lat, destination_lng | float | |
| departure_time | string | e.g. "07:00 AM" |
| is_active | boolean | |
| created_at, updated_at | timestamp | |

---

### 5. route_students (junction table)
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| route_id | FK → routes | |
| student_id | FK → users | |
| stop_order | INT | pickup sequence |
| is_active | boolean | |
| added_at | timestamp | |
| | UNIQUE(route_id, student_id) | no duplicates |
| | UNIQUE(route_id, stop_order) | no duplicate stops |

---

### 6. trips
> One execution of a route on a specific date

| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| organization_id | FK → organizations | |
| route_id | FK → routes | |
| trip_type | ENUM | MORNING, EVENING |
| status | ENUM | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| scheduled_date | date | |
| started_at, completed_at, cancelled_at | timestamp | |
| cancel_reason, notes | string | |
| created_at, updated_at | timestamp | |

---

### 7. trip_students
> Attendance + payment per student per trip

| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| trip_id | FK → trips | |
| student_id | FK → users | |
| attendance | ENUM | PRESENT, ABSENT, EXCUSED |
| payment_status | ENUM | PENDING, PAID, OVERDUE |
| amount_due, amount_paid | decimal | |
| payment_note | string | |
| picked_up_at, dropped_off_at | timestamp | |
| | UNIQUE(trip_id, student_id) | |

---

### 8. join_requests
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| organization_id | FK → organizations | |
| student_id | FK → users | |
| message | string | student's note |
| status | ENUM | PENDING, APPROVED, REJECTED |
| reviewed_at, review_note | timestamp / string | |
| created_at, updated_at | timestamp | |

---

### 9. audit_logs
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| action | ENUM | full list below |
| organization_id | FK → organizations | |
| user_id | FK → users | who triggered it |
| performed_by | FK → users | admin who acted |
| trip_id | FK → trips | |
| ip_address | string | for abuse detection |
| user_agent | string | device info |
| metadata | JSONB | flexible extra context |
| created_at | timestamp | |

---

## Enums

| Enum | Values |
|---|---|
| Role | STUDENT, DRIVER, BUS_OWNER, SUPER_ADMIN |
| TripType | MORNING, EVENING |
| TripStatus | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| RequestStatus | PENDING, APPROVED, REJECTED |
| AttendanceStatus | PRESENT, ABSENT, EXCUSED |
| PaymentStatus | PENDING, PAID, OVERDUE |
| AuditAction | LOGIN, FAILED_LOGIN, LOGOUT, PASSWORD_CHANGED, USER_CREATED, USER_SUSPENDED, USER_ACTIVATED, ROLE_CHANGED, ORG_CREATED, ORG_APPROVED, ORG_SUSPENDED, BUS_CREATED, BUS_UPDATED, BUS_DELETED, DRIVER_ASSIGNED_TO_BUS, DRIVER_REMOVED_FROM_BUS, STUDENT_ADDED_TO_ROUTE, STUDENT_REMOVED_FROM_ROUTE, JOIN_REQUEST_SUBMITTED, JOIN_REQUEST_APPROVED, JOIN_REQUEST_REJECTED, TRIP_CREATED, TRIP_STARTED, TRIP_COMPLETED, TRIP_CANCELLED, ATTENDANCE_MARKED, PAYMENT_CONFIRMED, PAYMENT_EDITED |

---

## Key Design Decisions

- **UUID everywhere** (not auto-increment) → prevents enumeration attacks
- **bcrypt for passwords** → never plain text
- **Indexes** on all foreign keys + status + date fields
- **Auto-trigger on updated_at** → never forget to update it in code
- **organizationId = NULL for Super Admin** → they see everything
- **UNIQUE constraints on route_students** → no duplicates
- **Separate trips table from routes** → route is the template, trip is the execution

---

## Generated Files

- `schema.prisma` — full Prisma schema
- `classride_supabase.sql` — paste directly into Supabase SQL editor

---

*ClassRide — Built by Dana Amacha*

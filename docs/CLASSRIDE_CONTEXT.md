# CLASSRIDE — FULL PROJECT CONTEXT
# Paste this at the start of every new Claude conversation
# Last Updated: [UPDATE THIS EVERY SESSION]
# Current Day: [UPDATE THIS EVERY SESSION]

---

## 🧠 HOW TO USE THIS DOCUMENT

Every time you start a new conversation with Claude, paste this entire document and say:
"Here is my ClassRide context document. We are on Day X. [describe what you want to do today]"

Claude will read it and have full context of everything — no re-explaining needed.

Update the "CURRENT PROGRESS" section at the end of every session.

---

## 👩‍💻 DEVELOPER PROFILE

- Name: Dana Amacha
- Location: Lebanon
- Goal: Remote job in Europe/US after graduation
- Current level: Fresh graduate, no experience
- OS: Windows
- Editor: VS Code
- Node.js + npm + npx: Installed
- AI/ML knowledge: Basic Python
- Timeline: 1-2 months to build ClassRide

---

## 🚀 PROJECT OVERVIEW

**Name:** ClassRide
**Tagline:** Smart Transportation Management Platform
**Type:** SaaS (Software as a Service) — Multi-tenant
**Market:** Lebanon (first launch)
**Business Model:** Charge bus owners a monthly subscription fee

**One sentence description:**
ClassRide is a SaaS platform that allows bus owners in Lebanon to digitally manage their entire student transportation operation — and uses AI to automatically optimize routes and assign students to buses.

**The problem it solves:**
Right now in Lebanon, bus owners manage everything manually:
- WhatsApp groups for communication
- Excel sheets for student lists
- Phone calls to assign drivers
- Paper records for payments
- Zero visibility for students
- Zero data for optimization

ClassRide replaces all of that with one platform.

**Lebanon-specific context:**
- Cash economy → payment tracking in cash is core feature
- WhatsApp culture → important for v2
- USD + LBP dual currency consideration
- Universities clustered in known areas (AUB, LAU, USJ, NDU, LU)
- AI routing is extremely valuable here because bus routes are chaotic and unoptimized

---

## 👥 USER ROLES (4 ROLES)

### 1. SUPER_ADMIN (Dana — the platform owner)
- Approves bus owner registrations
- Manages subscription plans
- Monitors entire platform
- Sees all organizations + activity
- Suspends/activates any account
- Has NO organization (organizationId = null)

### 2. BUS_OWNER
- Registers organization on ClassRide
- Pays monthly subscription
- Adds their buses + plate numbers
- Assigns drivers to buses
- Manually adds students to routes
- Approves/rejects student join requests
- Triggers AI route optimization
- Monitors trips in real time
- Tracks attendance per student
- Tracks cash payments per student
- Views reports + trip history

### 3. DRIVER
- Logs into driver mobile app
- Sees assigned bus + route
- Sees ordered list of students to pick up
- Marks each student picked up / absent
- Confirms cash payment received
- Starts and completes trip
- Views trip history

### 4. STUDENT
- Downloads mobile app
- Registers with exact home address
- Sends join request to bus owner
- Gets notified when approved
- Sees assigned bus + pickup time
- Sees their stop order in the route
- Views trip schedule (morning/evening)
- Can mark themselves absent for a day

---

## 🏗️ SYSTEM ARCHITECTURE

```
ClassRide Platform
│
├── 🔧 Backend (NestJS + PostgreSQL)
│   ├── Multi-tenant SaaS
│   ├── Auth + JWT + RBAC
│   ├── Trip management
│   ├── Subscription enforcement
│   └── Audit logs + Security
│
├── 🤖 AI Microservice (Python + FastAPI)
│   ├── Student clustering (K-means)
│   ├── Bus assignment (greedy algorithm)
│   ├── Route optimization (nearest neighbor)
│   └── ETA calculation (Google Maps API)
│
├── 📱 Mobile App (React Native + Expo)
│   ├── Student app
│   └── Driver app
│
└── 🖥️ Admin Dashboard (React + TailwindCSS)
    ├── Bus owner dashboard
    └── Super admin panel
```

---

## 🛠️ FULL TECH STACK (LOCKED IN)

| Layer | Technology | Why We Chose It |
|---|---|---|
| Backend framework | NestJS | Built on Node.js + Express. Structured, scalable, production-ready. Better than raw Express for complex apps. High CV value. |
| Runtime | Node.js | NestJS runs on it. Industry standard. |
| Database | PostgreSQL via Supabase | Relational, reliable, free to start. Supabase gives visual dashboard + instant setup. |
| ORM | Prisma | Sits between NestJS and PostgreSQL. Type-safe, auto-generates TypeScript types, handles migrations, prevents SQL injection. |
| AI Service | Python + FastAPI | Separate microservice. Python has best AI/ML libraries. FastAPI is fast and modern. Clean separation of concerns. |
| Mobile | React Native + Expo | One codebase for iOS + Android. Expo simplifies setup on Windows. |
| Admin Web | React + TailwindCSS | Fast to build. Industry standard. |
| Authentication | JWT + Refresh Tokens | Industry standard. Stateless. Secure. |
| Maps + ETA | Google Maps API | Route display + real distance/time calculation. |
| Backend Hosting | Railway | Simple deployment, free tier to start. |
| DB Hosting | Supabase | Already our DB provider. |
| Web Hosting | Vercel | Free, instant React deployment. |
| Version Control | GitHub | Industry standard. Public repo for CV. |

---

## 🗄️ DATABASE SCHEMA (COMPLETE — v2)

### Tables (9 total):

**1. organizations**
- id (UUID, PK)
- name, email, phone, address, logo_url
- is_active (boolean) — can be suspended
- is_approved (boolean) — Super Admin must approve
- created_at, updated_at

**2. users**
- id (UUID, PK)
- email (unique), password (bcrypt hash ONLY)
- first_name, last_name, phone
- role (ENUM: STUDENT, DRIVER, BUS_OWNER, SUPER_ADMIN)
- is_active (boolean)
- organization_id (FK → organizations, NULL for Super Admin)
- home_address, home_lat, home_lng (students)
- university (student destination)
- created_at, updated_at

**3. buses**
- id (UUID, PK)
- organization_id (FK → organizations)
- plate_number (unique)
- model, capacity
- is_active (boolean)
- driver_id (FK → users, unique — one driver per bus)
- created_at, updated_at

**4. routes**
- id (UUID, PK)
- organization_id (FK → organizations)
- bus_id (FK → buses)
- name (e.g. "Morning Route - AUB")
- trip_type (ENUM: MORNING, EVENING)
- destination (university name)
- destination_lat, destination_lng
- departure_time (e.g. "07:00 AM")
- is_active (boolean)
- created_at, updated_at

**5. route_students** (junction table)
- id (UUID, PK)
- route_id (FK → routes)
- student_id (FK → users)
- stop_order (INT — pickup sequence)
- is_active (boolean)
- added_at
- UNIQUE(route_id, student_id)
- UNIQUE(route_id, stop_order)

**6. trips** (one execution of a route on a specific date)
- id (UUID, PK)
- organization_id (FK → organizations)
- route_id (FK → routes)
- trip_type (ENUM: MORNING, EVENING)
- status (ENUM: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
- scheduled_date
- started_at, completed_at, cancelled_at
- cancel_reason, notes
- created_at, updated_at

**7. trip_students** (attendance + payment per student per trip)
- id (UUID, PK)
- trip_id (FK → trips)
- student_id (FK → users)
- attendance (ENUM: PRESENT, ABSENT, EXCUSED)
- payment_status (ENUM: PENDING, PAID, OVERDUE)
- amount_due, amount_paid, payment_note
- picked_up_at, dropped_off_at
- UNIQUE(trip_id, student_id)

**8. join_requests**
- id (UUID, PK)
- organization_id (FK → organizations)
- student_id (FK → users)
- message (student's note)
- status (ENUM: PENDING, APPROVED, REJECTED)
- reviewed_at, review_note
- created_at, updated_at

**9. audit_logs**
- id (UUID, PK)
- action (ENUM — full list below)
- organization_id (FK → organizations)
- user_id (FK → users) — who triggered it
- performed_by (FK → users) — admin who acted
- trip_id (FK → trips)
- ip_address — for abuse detection
- user_agent — device info
- metadata (JSONB) — flexible extra context
- created_at

### Enums:
- Role: STUDENT, DRIVER, BUS_OWNER, SUPER_ADMIN
- TripType: MORNING, EVENING
- TripStatus: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- RequestStatus: PENDING, APPROVED, REJECTED
- AttendanceStatus: PRESENT, ABSENT, EXCUSED
- PaymentStatus: PENDING, PAID, OVERDUE
- AuditAction: LOGIN, FAILED_LOGIN, LOGOUT, PASSWORD_CHANGED, USER_CREATED, USER_SUSPENDED, USER_ACTIVATED, ROLE_CHANGED, ORG_CREATED, ORG_APPROVED, ORG_SUSPENDED, BUS_CREATED, BUS_UPDATED, BUS_DELETED, DRIVER_ASSIGNED_TO_BUS, DRIVER_REMOVED_FROM_BUS, STUDENT_ADDED_TO_ROUTE, STUDENT_REMOVED_FROM_ROUTE, JOIN_REQUEST_SUBMITTED, JOIN_REQUEST_APPROVED, JOIN_REQUEST_REJECTED, TRIP_CREATED, TRIP_STARTED, TRIP_COMPLETED, TRIP_CANCELLED, ATTENDANCE_MARKED, PAYMENT_CONFIRMED, PAYMENT_EDITED

### Key design decisions:
- UUID everywhere (not auto-increment) → prevents enumeration attacks
- bcrypt for passwords → never plain text
- Indexes on all foreign keys + status + date fields
- Auto-trigger on updated_at → never forget to update it in code
- organizationId = NULL for Super Admin → they see everything
- UNIQUE constraints on route_students → no duplicates
- Separate trips table from routes → route is template, trip is execution

### Files already generated:
- schema.prisma → full Prisma schema
- classride_supabase.sql → paste directly into Supabase SQL editor

---

## 💳 SUBSCRIPTION MODEL

**3 Tiers:**

| Plan | Buses | Students | AI Optimization | Price |
|---|---|---|---|---|
| Starter | 1 | up to 30 | ❌ Manual only | Free / Low cost |
| Growth | up to 5 | up to 150 | ✅ Included | Monthly fee |
| Pro | Unlimited | Unlimited | ✅ Included | Higher monthly fee |

**Tables needed (to be added to schema):**
- subscription_plans
- subscriptions (which plan each org is on)

**Logic:**
- Super Admin manages plans
- Bus owner pays → subscription activated
- System enforces limits (can't add 6th bus on Starter)
- Expired subscription → org suspended automatically

---

## 🤖 AI MICROSERVICE DETAILS

**Language:** Python
**Framework:** FastAPI (separate from NestJS)
**Runs as:** Independent microservice
**Called by:** NestJS backend (internal HTTP call)

**What it does step by step:**

1. Bus owner clicks "Optimize Routes"
2. NestJS sends student data to FastAPI
3. FastAPI receives:
   - All approved students with home coordinates
   - Their university destinations
   - Available buses + capacities
4. Step 1 — Clustering (K-means): Groups students by geographic proximity + same destination
5. Step 2 — Assignment (Greedy): Assigns each cluster to a bus respecting capacity
6. Step 3 — Route Optimization (Nearest Neighbor): Orders pickup stops for minimum distance
7. Step 4 — ETA (Google Maps API): Calculates real travel time per stop
8. Returns to NestJS: optimized route per bus with ordered stops + ETAs
9. Bus owner reviews + approves → routes saved to DB

**Algorithms:**
- K-means clustering → group by location
- Greedy assignment → respect bus capacity
- Nearest neighbor (simple TSP) → optimize stop order
- Google Maps Distance Matrix API → real ETAs

---

## 🔐 SECURITY APPROACH (SECURITY-FIRST FROM DAY 1)

**Philosophy:** Build it secure, then try to hack it yourself.

**Every feature we build follows this pattern:**
1. Here's the feature
2. Here's how we secure it (defensive)
3. Here's how a hacker would attack it (offensive)
4. Here's how our code stops that attack

**Security layers we implement:**

### Authentication Security:
- bcrypt password hashing (never plain text)
- JWT access tokens (short expiry)
- Refresh token rotation
- Rate limiting on login endpoint
- Brute force protection
- Secure error messages (no user enumeration)
- Audit log: every LOGIN + FAILED_LOGIN

### Authorization Security:
- RBAC (Role Based Access Control) on every endpoint
- Organization isolation (tenant scoping on EVERY query)
- IDOR prevention (you can never access other users' data)
- Privilege escalation prevention
- Ownership checks on all resources

### Input Security:
- DTO validation on all inputs (class-validator)
- SQL injection prevention (Prisma handles this)
- XSS prevention
- Mass assignment prevention

### Infrastructure Security:
- Rate limiting on all sensitive endpoints
- Suspicious behavior detection
- Generic error messages in production
- No stack traces exposed
- .env secrets never in GitHub
- HTTPS in production

### Audit Trail:
- Every important action logged
- IP address recorded
- User agent recorded
- Metadata for context
- Tamper-resistant logs

**Attacks we will test after building:**
- Brute force login
- JWT token manipulation
- Refresh token abuse
- IDOR (access other orgs/users data)
- Privilege escalation (student → admin)
- Tenant jumping (org A → org B data)
- SQL injection attempts
- Mass assignment attacks
- Rate limit bypass

---

## 📅 FULL 64-DAY BUILD PLAN

### PHASE 1 — FOUNDATION (Week 1)

**Day 1** — Environment + NestJS project setup
- Verify Node, npm, npx versions
- Install NestJS CLI
- Create NestJS project
- Understand folder structure
- Push to GitHub (first commit)

**Day 2** — Supabase + Prisma setup
- Create Supabase project
- Install Prisma
- Connect to DB
- Paste schema
- Run first migration

**Day 3** — Understand the schema
- Walk through every table
- Understand every relation
- Understand every enum
- Verify DB in Supabase dashboard

**Day 4** — NestJS structure + modules
- Create all modules
- Understand NestJS architecture (modules, controllers, services)
- Lock in folder structure

**Day 5** — Environment + Config
- .env setup
- Config module (NestJS)
- .gitignore (security)
- Never push secrets to GitHub

### PHASE 2 — AUTHENTICATION (Week 2)

**Day 6** — Users module
- User entity
- Create user (register)
- Password hashing (bcrypt)

**Day 7** — JWT Authentication
- Login endpoint
- Generate access token
- Return token to client

**Day 8** — Auth Guards
- Protect routes
- Verify JWT on every request
- Extract user from token

**Day 9** — Refresh Tokens
- Generate refresh token
- Refresh endpoint
- Invalidate on logout

**Day 10** — RBAC
- Roles guard
- Custom decorators
- Test each role

**Day 11** — Organization isolation
- Tenant middleware
- Every query scoped to org
- No cross-tenant data leaks

**Day 12** — Auth security hardening
- Rate limit login
- Brute force protection
- Secure error messages
- Audit log: LOGIN + FAILED_LOGIN

### PHASE 3 — CORE FEATURES (Week 3)

**Day 13** — Organizations module
- Register organization
- Super admin approves
- Subscription check middleware
- Suspend organization

**Day 14** — Buses module
- Add bus
- Assign driver to bus
- Capacity management

**Day 15** — Routes module
- Create route
- Morning/Evening types
- Link to bus

**Day 16** — Route Students
- Add student to route
- Stop order management
- Capacity check
- Remove student

**Day 17** — Join Requests
- Student sends request
- Bus owner approves/rejects
- Audit log

**Day 18** — Students module
- Student profile
- Home address
- View assigned route

**Day 19** — Security audit week 3
- Test IDOR on all endpoints
- Test cross-tenant access
- Fix vulnerabilities found

### PHASE 4 — TRIPS (Week 4)

**Day 20** — Trips module
- Create trip from route
- Schedule morning/evening

**Day 21** — Trip lifecycle
- Status transitions (SCHEDULED → IN_PROGRESS → COMPLETED)
- Validate transitions
- Timestamps per status

**Day 22** — Trip Students
- Auto-populate from route
- Attendance marking

**Day 23** — Payment tracking
- Amount due per student
- Driver confirms cash
- Edit payment history

**Day 24** — Driver trip flow
- View assigned trip
- Ordered student list
- Start trip → mark pickups → complete

**Day 25** — Trip history + reports
- Bus owner views all trips
- Attendance summary
- Payment summary

**Day 26** — Security audit week 4
- Driver access control
- Student data isolation
- Payment manipulation prevention

### PHASE 5 — AI SERVICE (Week 5)

**Day 27** — FastAPI setup
- Create Python project
- First endpoint running

**Day 28** — Student clustering
- K-means implementation
- Group by location + destination

**Day 29** — Bus assignment
- Greedy algorithm
- Respect capacity limits

**Day 30** — Route optimization
- Nearest neighbor algorithm
- Order pickup stops

**Day 31** — Google Maps integration
- Distance Matrix API
- ETA per stop

**Day 32** — Connect AI to NestJS
- NestJS calls FastAPI
- Results saved to DB

**Day 33** — AI security
- Internal service authentication
- Rate limit optimization endpoint

### PHASE 6 — SUBSCRIPTIONS (Week 6)

**Day 34** — Subscription plans
- Create plans in DB
- Starter/Growth/Pro limits

**Day 35** — Subscription middleware
- Check active subscription
- Enforce bus + student limits

**Day 36** — Billing cycle
- Expiry detection
- Grace period
- Auto-suspension

**Day 37** — Super admin API
- View all organizations
- Platform statistics
- Manage subscriptions

### PHASE 7 — SECURITY HARDENING (Week 7)

**Day 38** — Full RBAC audit
**Day 39** — IDOR penetration test
**Day 40** — Rate limiting + abuse detection
**Day 41** — Input security (injection attempts)
**Day 42** — Audit log review
**Day 43** — Error handling security
**Day 44** — Security documentation (pentest report)

### PHASE 8 — ADMIN DASHBOARD (Week 8)

**Day 45** — React project setup + TailwindCSS
**Day 46** — Auth pages (login + protected routes)
**Day 47** — Bus owner dashboard (stats, buses, routes)
**Day 48** — Trip management UI
**Day 49** — Students + Join requests UI
**Day 50** — AI optimization UI
**Day 51** — Super admin panel

### PHASE 9 — MOBILE APP (Week 9)

**Day 52** — Expo + React Native setup
**Day 53** — Student auth flow + profile setup
**Day 54** — Student home screen (route + trip info)
**Day 55** — Driver auth + home screen
**Day 56** — Driver trip flow (start, pickups, complete)
**Day 57** — Driver payment screen
**Day 58** — Connect + test everything end-to-end

### PHASE 10 — LAUNCH PREP (Week 10)

**Day 59** — GitHub cleanup + README + architecture diagram
**Day 60** — Deployment (Railway + Supabase + Vercel)
**Day 61** — Production hardening (HTTPS, CORS, env)
**Day 62** — Find first real bus owner in Lebanon
**Day 63** — CV + LinkedIn update
**Day 64** — Interview prep (explain architecture + security + AI)

---

## 📁 PROJECT FOLDER STRUCTURE (PLANNED)

```
classride/
├── classride-backend/          ← NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── organizations/
│   │   ├── buses/
│   │   ├── routes/
│   │   ├── trips/
│   │   ├── subscriptions/
│   │   ├── audit/
│   │   └── common/
│   │       ├── guards/
│   │       ├── decorators/
│   │       ├── filters/
│   │       └── interceptors/
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env
│
├── classride-ai/               ← Python FastAPI
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── requirements.txt
│
├── classride-web/              ← React Admin
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   └── .env
│
└── classride-mobile/           ← React Native Expo
    ├── src/
    │   ├── screens/
    │   ├── navigation/
    │   └── services/
    └── app.json
```

---

## 🎯 CV + CAREER STRATEGY

**Target:** Remote jobs in Europe/US
**Timeline:** Start applying month 6

**What ClassRide gives the CV:**
- Full-stack development (NestJS + React Native + React)
- Database design (PostgreSQL + Prisma + multi-tenant)
- Security engineering (RBAC + IDOR + rate limiting + audit logs + pentest)
- AI/Algorithm implementation (clustering + route optimization)
- System architecture (microservices + SaaS design)
- Real product thinking (subscription model + multi-tenancy)
- Lebanon market problem solving

**CV statement:**
"Founded ClassRide — a multi-tenant SaaS transportation platform for the Lebanese market. Built full backend with NestJS + PostgreSQL, AI route optimization microservice in Python, React Native mobile app, and React admin dashboard. Performed penetration testing and fixed IDOR, brute force, and privilege escalation vulnerabilities."

**Job platforms to target:**
- LinkedIn (remote filter)
- RemoteOK.com
- WeWorkRemotely.com
- Wellfound (startups)
- Toptal (if accepted)

**Best countries to target:**
- Netherlands, Germany, Estonia (EU friendly)
- Canada (easier than US)
- US startups (hardest, highest pay)

**Additional CV items needed alongside ClassRide:**
- LeetCode (50-100 medium problems)
- One more smaller project (different domain)
- GitHub consistent activity
- One technical blog post about ClassRide architecture
- LinkedIn optimized for remote work

---

## ✅ CURRENT PROGRESS

### Completed:
- [x] Full project vision defined
- [x] Tech stack decided + reasons documented
- [x] Database schema v2 designed (9 tables)
- [x] schema.prisma file generated
- [x] classride_supabase.sql file generated
- [x] 64-day build plan created
- [x] Security approach defined
- [x] AI microservice plan defined
- [x] Subscription model defined
- [x] Career strategy defined

### In Progress:
- [ ] Day 1 — NestJS project setup
  - [ ] Verify Node, npm, npx versions
  - [ ] Install NestJS CLI
  - [ ] Create project
  - [ ] Understand structure
  - [ ] Push to GitHub

### Next Session:
Start Day 1 — Need to verify Node/npm/npx versions first

### Notes from last session:
- Dana is on Windows + VS Code
- Node.js + npm already installed
- Need to verify exact versions before starting
- We stay in same conversation as long as possible
- Use this doc when starting new conversation

---

## ⚠️ IMPORTANT RULES FOR CLAUDE

When Dana pastes this document, you must:

1. Read every section completely
2. Never suggest technologies we haven't agreed on
3. Always explain WHY before showing code
4. Always explain the security angle of every feature
5. Never skip steps — one day at a time
6. Always explain what a hacker could do + how we stop it
7. Keep the same teaching style:
   - What is this technology?
   - Why are we using it for ClassRide?
   - What does it protect us from?
   - CV value?
8. Never move to next day until current day works
9. Remind Dana to update "CURRENT PROGRESS" at end of session
10. If Dana says "continue" or "next" — check current progress first

---

*ClassRide — Built by Dana Amacha*
*"We don't move to the next day until today is working and you understand why."*

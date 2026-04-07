# ClassRide — 64-Day Build Plan

## Phase Overview

| Phase | Days | Focus |
|---|---|---|
| Phase 1 | 1–5 | Foundation |
| Phase 2 | 6–12 | Authentication |
| Phase 3 | 13–19 | Core Features |
| Phase 4 | 20–26 | Trips |
| Phase 5 | 27–33 | AI Service |
| Phase 6 | 34–37 | Subscriptions |
| Phase 7 | 38–44 | Security Hardening |
| Phase 8 | 45–51 | Admin Dashboard |
| Phase 9 | 52–58 | Mobile App |
| Phase 10 | 59–64 | Launch Prep |

---

## Phase 1 — Foundation (Week 1)

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

---

## Phase 2 — Authentication (Week 2)

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

---

## Phase 3 — Core Features (Week 3)

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

---

## Phase 4 — Trips (Week 4)

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

---

## Phase 5 — AI Service (Week 5)

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

---

## Phase 6 — Subscriptions (Week 6)

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

---

## Phase 7 — Security Hardening (Week 7)

**Day 38** — Full RBAC audit
**Day 39** — IDOR penetration test
**Day 40** — Rate limiting + abuse detection
**Day 41** — Input security (injection attempts)
**Day 42** — Audit log review
**Day 43** — Error handling security
**Day 44** — Security documentation (pentest report)

---

## Phase 8 — Admin Dashboard (Week 8)

**Day 45** — React project setup + TailwindCSS
**Day 46** — Auth pages (login + protected routes)
**Day 47** — Bus owner dashboard (stats, buses, routes)
**Day 48** — Trip management UI
**Day 49** — Students + Join requests UI
**Day 50** — AI optimization UI
**Day 51** — Super admin panel

---

## Phase 9 — Mobile App (Week 9)

**Day 52** — Expo + React Native setup
**Day 53** — Student auth flow + profile setup
**Day 54** — Student home screen (route + trip info)
**Day 55** — Driver auth + home screen
**Day 56** — Driver trip flow (start, pickups, complete)
**Day 57** — Driver payment screen
**Day 58** — Connect + test everything end-to-end

---

## Phase 10 — Launch Prep (Week 10)

**Day 59** — GitHub cleanup + README + architecture diagram
**Day 60** — Deployment (Railway + Supabase + Vercel)
**Day 61** — Production hardening (HTTPS, CORS, env)
**Day 62** — Find first real bus owner in Lebanon
**Day 63** — CV + LinkedIn update
**Day 64** — Interview prep (explain architecture + security + AI)

---

*ClassRide — Built by Dana Amacha*
*"We don't move to the next day until today is working and you understand why."*

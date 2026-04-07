# ClassRide — Tech Stack

All technology choices are locked in. Do not change without full justification.

---

## Stack Overview

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

## Developer Environment

- OS: Windows
- Editor: VS Code
- Node.js + npm + npx: Installed

---

*ClassRide — Built by Dana Amacha*

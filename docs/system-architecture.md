# ClassRide — System Architecture

## High-Level Overview

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

## Folder Structure

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

## Communication Flow

```
Mobile App (React Native)
        ↕ REST API (JWT)
NestJS Backend
        ↕ Prisma ORM
PostgreSQL (Supabase)

NestJS Backend
        ↕ Internal HTTP
FastAPI AI Microservice
        ↕ Google Maps API
Distance + ETA Data

React Admin Dashboard
        ↕ REST API (JWT)
NestJS Backend
```

---

## Hosting

| Service | Provider |
|---|---|
| Backend | Railway |
| Database | Supabase |
| Admin Web | Vercel |
| AI Microservice | Railway (separate service) |

---

*ClassRide — Built by Dana Amacha*

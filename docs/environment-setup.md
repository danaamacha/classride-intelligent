# ClassRide — Environment Setup

## Overview

All secrets and environment-specific config live in `.env`.
This file is **never committed to GitHub** — it's in `.gitignore`.

Every developer who clones the project must create their own `.env` file.

---

## .env Structure

```env
# ─────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────

# Used by Prisma Client at runtime (Transaction pooler - port 6543)
DATABASE_URL="postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

# Used by Prisma Migrate only (Session pooler - port 5432)
DIRECT_URL="postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# ─────────────────────────────────────────
# APP
# ─────────────────────────────────────────

PORT=3001
NODE_ENV=development

# ─────────────────────────────────────────
# JWT (filled in on Day 6)
# ─────────────────────────────────────────

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Variable Reference

| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | ✅ | Supabase transaction pooler — used by app at runtime |
| DIRECT_URL | ✅ | Supabase session pooler — used by Prisma migrations only |
| PORT | ✅ | Port the NestJS server runs on (3001 to avoid conflicts) |
| NODE_ENV | ✅ | `development` locally, `production` on Railway |
| JWT_SECRET | ✅ Day 6 | Secret key for signing access tokens |
| JWT_REFRESH_SECRET | ✅ Day 6 | Secret key for signing refresh tokens |
| JWT_EXPIRES_IN | ✅ Day 6 | Access token expiry (15 minutes) |
| JWT_REFRESH_EXPIRES_IN | ✅ Day 6 | Refresh token expiry (7 days) |

---

## Security Rules

- **Never** commit `.env` to GitHub
- **Never** share your `DATABASE_URL` or JWT secrets in chat or code
- **Never** use the same JWT_SECRET in development and production
- JWT_SECRET should be a long random string (32+ characters) in production
- Rotate secrets if they are ever accidentally exposed

---

## How to Generate a Strong JWT Secret

Run this in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use the output as your `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## Environment per Stage

| Variable | Development | Production |
|---|---|---|
| NODE_ENV | development | production |
| PORT | 3001 | set by Railway automatically |
| DATABASE_URL | Supabase (same) | Supabase (same) |
| JWT_SECRET | any string | long random string |

---

*ClassRide — Built by Dana Amacha*

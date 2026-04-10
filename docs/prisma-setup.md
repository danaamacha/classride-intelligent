# ClassRide — Prisma Setup

## Version
Prisma v7 (important — configuration changed significantly from v6)

## Packages Installed

```bash
npm install prisma --save-dev
npm install @prisma/client
npm install @prisma/adapter-pg
npm install dotenv
```

---

## File Structure

```
classride-backend/
├── prisma/
│   ├── schema.prisma        ← database models + enums
│   └── migrations/          ← auto-generated migration history
├── prisma.config.ts         ← Prisma v7 config (replaces datasource url in schema)
└── .env                     ← database URLs (never commit this)
```

---

## Why Two Database URLs?

Prisma v7 + Supabase requires two separate connection strings:

| Variable | Pooler Type | Port | Used For |
|---|---|---|---|
| DATABASE_URL | Transaction pooler | 6543 | Runtime queries (app running) |
| DIRECT_URL | Session pooler | 5432 | Migrations only |

The transaction pooler (6543) does not support Prisma migrations because it uses prepared statements that conflict with connection pooling. The session pooler (5432) bypasses this issue.

---

## prisma.config.ts

This file replaces the old `url = env("DATABASE_URL")` in `schema.prisma` (removed in Prisma v7).

```typescript
import path from 'path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const connectionString = process.env.DIRECT_URL!;
      return new PrismaPg({ connectionString });
    },
  },
  datasource: {
    url: process.env.DIRECT_URL!,
  },
});
```

---

## schema.prisma datasource block

In Prisma v7, the datasource block no longer contains the URL:

```prisma
datasource db {
  provider = "postgresql"
}
```

The URL is managed entirely in `prisma.config.ts`.

---

## Common Commands

| Command | What it does |
|---|---|
| `npx prisma migrate dev --name <name>` | Create + apply a new migration |
| `npx prisma migrate status` | Check migration status |
| `npx prisma studio` | Open visual DB browser |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate reset` | Reset DB + rerun all migrations (dev only) |

---

## Migration History

| Migration | Date | Description |
|---|---|---|
| init | Day 2 | All 9 tables created |

---

*ClassRide — Built by Dana Amacha*

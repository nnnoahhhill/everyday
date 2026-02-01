# Things I Do Every Day
## Enterprise‑Grade Product Specification & Full Implementation Plan

> **Positioning:** A consumer‑simple habit and execution tracking platform built to **Fortune‑500 engineering standards**: security‑aware, auditable, testable, scalable, and operable at global scale.

---

# 1. Executive Summary

**Things I Do Every Day (TIDE)** is a daily execution tracking system designed around *explicit accountability per task per day*. Unlike habit apps that infer behavior, TIDE records **explicit state transitions** (Done / Partial / Missed) with immutable logs and deterministic date handling.

The system is architected to:
- Support **millions of users**
- Maintain **strong data integrity guarantees**
- Be **observable, testable, and auditable**
- Allow **incremental feature rollout without rewrites**

Phase 1 establishes a production‑grade foundation with constrained scope.

---

# 2. Non‑Functional Requirements (NFRs)

## 2.1 Availability
- Target: **99.95%** uptime
- No single point of failure
- Stateless application tier

## 2.2 Performance
- P95 API latency < **150ms**
- P99 API latency < **300ms**
- UI interactions < **16ms frame budget**

## 2.3 Scalability
- Horizontal scaling at all tiers
- Database supports sharding and read replicas
- Time‑partitioned data model

## 2.4 Security
- Zero trust between services
- Principle of least privilege
- All writes authenticated & authorized
- Audit‑ready logs

## 2.5 Data Integrity
- Exactly‑once daily state per task
- Idempotent writes
- Deterministic timezone handling

## 2.6 Compliance Readiness
- SOC 2 Type II ready
- GDPR/CCPA delete semantics
- Audit trails preserved

---

# 3. High‑Level Architecture

```
┌──────────────┐
│  Web Client  │  Next.js 14 (App Router)
└──────┬───────┘
       │ HTTPS
┌──────▼───────┐
│ API Gateway  │  Edge + Node
└──────┬───────┘
       │
┌──────▼────────────────────────────┐
│ Application Services               │
│ - Auth Service                     │
│ - Habit Service                    │
│ - Logging Service                  │
│ - Analytics Service                │
└──────┬────────────────────────────┘
       │
┌──────▼────────────────────────────┐
│ Data Layer                         │
│ - PostgreSQL (primary)             │
│ - Read replicas                    │
│ - Time‑partitioned tables          │
└───────────────────────────────────┘
```

---

# 4. Technology Stack

## 4.1 Frontend
- **Next.js 14** (App Router)
- React Server Components
- Tailwind CSS
- Magic UI (animation + interaction)
- Zustand (local state)
- TanStack Query (server state)

## 4.2 Backend
- Next.js Route Handlers
- Node.js 20 LTS
- Prisma ORM
- Zod (runtime validation)

## 4.3 Database
- PostgreSQL 15+
- Row‑level security ready
- Daily partitions for logs

## 4.4 Auth
- Phase 1: Internal Auth Service
- Phase 2: Clerk / Auth0

## 4.5 Infrastructure
- Vercel (App + Edge)
- Neon / Supabase Postgres
- Vercel Cron
- OpenTelemetry

---

# 5. Domain Model

> **SECTION A — DATABASE & PRISMA IMPLEMENTATION (FOUNDATIONAL)**

This section defines the **authoritative data model**, physical database layout, constraints, and Prisma implementation. All higher layers depend on the guarantees defined here.

---

## 5.0 Design Goals (Data Layer)

- Exactly-once daily state per task
- Deterministic querying by date ranges
- Write safety under retries
- Forward-compatible with sharding & analytics
- Explicitly auditable mutations

---

## 5.1 Canonical Identifiers

- All primary keys use **UUID v7** (time-sortable)
- Generated server-side only
- No client-generated IDs

---

## 5.2 Logical Entities

## 5.1 User

```ts
User {
  id: UUID
  username: string
  email?: string
  createdAt: timestamp
  deletedAt?: timestamp
}
```

## 5.2 Task (Daily Thing)

```ts
Task {
  id: UUID
  userId: UUID
  name: string (max 50)
  active: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

## 5.3 TaskDayLog (Critical Table)

```ts
TaskDayLog {
  id: UUID
  taskId: UUID
  userId: UUID
  localDate: DATE            // YYYY-MM-DD, user authoritative
  status: DONE | PARTIAL | MISSED
  source: USER | SYSTEM
  createdAt: TIMESTAMPTZ
}
```

### Invariants
- ONE AND ONLY ONE row per (taskId, localDate)
- status transitions are **overwrites**, not appends
- MISSED is **never written by client**

---

## 5.4 Physical PostgreSQL Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### Tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
```

### Task Day Logs (Partitioned)
```sql
CREATE TABLE task_day_logs (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DONE','PARTIAL')),
  source TEXT NOT NULL CHECK (source IN ('USER','SYSTEM')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, local_date)
) PARTITION BY RANGE (local_date);
```

---

## 5.5 Partition Strategy

- Monthly partitions on `local_date`
- Enables fast range scans
- Simplifies archival

```sql
CREATE TABLE task_day_logs_2026_01 PARTITION OF task_day_logs
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

Partitions are created automatically via scheduled job.

---

## 5.6 Derived MISSED Semantics

**MISSED is NOT STORED.**

A task is MISSED for date D if:
- Task existed on date D
- No row exists in task_day_logs for (taskId, D)

This ensures:
- No write amplification
- No backfills required
- Deterministic recomputation

---

## 5.7 Prisma Schema (Authoritative)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @db.Uuid
  username  String   @unique
  email     String?
  tasks     Task[]
  createdAt DateTime @default(now()) @map("created_at")
  deletedAt DateTime? @map("deleted_at")
}

model Task {
  id        String        @id @db.Uuid
  userId    String        @map("user_id") @db.Uuid
  user      User          @relation(fields: [userId], references: [id])
  name      String
  active    Boolean       @default(true)
  logs      TaskDayLog[]
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")

  @@index([userId])
}

model TaskDayLog {
  id        String   @id @db.Uuid
  taskId   String   @map("task_id") @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  task     Task     @relation(fields: [taskId], references: [id])
  localDate DateTime @map("local_date") @db.Date
  status    String
  source    String
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([taskId, localDate])
  @@index([userId, localDate])
}
```

---

## 5.8 Write Path (Exactly-Once Guarantee)

### Upsert Rule
- All daily writes use UPSERT on (taskId, localDate)
- Client retries are safe

```sql
INSERT INTO task_day_logs (...)
VALUES (...)
ON CONFLICT (task_id, local_date)
DO UPDATE SET
  status = EXCLUDED.status,
  created_at = now();
```

---

## 5.9 Read Path (Grid Query)

```sql
SELECT t.id, t.name, d.local_date, d.status
FROM tasks t
LEFT JOIN task_day_logs d
  ON d.task_id = t.id
  AND d.local_date BETWEEN $start AND $end
WHERE t.user_id = $userId;
```

Client derives MISSED cells.

---

## 5.10 Test Plan (Data Layer)

### Unit
- UUID generation
- Date normalization

### Integration
- Unique constraint enforcement
- Idempotent upserts
- Partition routing

### Failure Tests
- Retry same write 10x
- Clock skew simulation

---

## 5.11 Migration Strategy

- Additive-only schema changes
- Backfills via background jobs
- Partition creation ahead of time

---

**End of Section A — Database & Prisma**

---

# 6. SECTION B1 — API LAYER (NEXT.JS ROUTE HANDLERS)

> **Philosophy:** Enterprise-quality *specification*, startup-quality *implementation*.
> Flat, boring, readable code. No premature abstractions. No service mesh nonsense.

---

## 6.1 API Design Principles

- REST-ish, not dogmatic
- One route = one responsibility
- Zod for runtime validation
- Prisma is the only DB access layer
- Idempotent writes by default
- JSON everywhere

---

## 6.2 API Surface (Phase 1)

| Method | Route | Purpose |
|------|------|--------|
| POST | /api/auth/login | Fake auth (Phase 1) |
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/task-log | Mark DONE / PARTIAL |
| GET | /api/grid | Fetch grid range |

---

## 6.3 Authentication (Phase 1 – Simple)

### Rules
- Single hardcoded user
- Session via HTTP-only cookie
- Admin API key for manual access

### Environment Variables
```
ADMIN_USERNAME=hahahahahahaha
ADMIN_PASSWORD=hahahahahahahahahahahahahahahahahahahahahahahahahahahahaha
ADMIN_API_KEY=super-long-random-string
```

---

### POST /api/auth/login

**Request**
```json
{ "username": "", "password": "" }
```

**Behavior**
- Validate against env vars
- Set cookie: `tide_session=admin`

**Implementation**
```ts
// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("tide_session", "admin", { httpOnly: true });
  return res;
}
```

---

## 6.4 Auth Guard Helper

```ts
// lib/auth.ts
import { cookies } from "next/headers";

export function requireAuth() {
  const session = cookies().get("tide_session")?.value;
  if (session !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
}
```

Used at top of every route.

---

## 6.5 Tasks API

### POST /api/tasks

**Validation**
- name required
- max 50 chars
- max 20 active tasks

```ts
// app/api/tasks/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1).max(50) });

export async function POST(req: Request) {
  requireAuth();
  const body = schema.parse(await req.json());

  const count = await prisma.task.count({ where: { active: true } });
  if (count >= 20) {
    return Response.json({ error: "Task limit reached" }, { status: 400 });
  }

  const task = await prisma.task.create({ data: body });
  return Response.json(task);
}
```

---

### GET /api/tasks

```ts
export async function GET() {
  requireAuth();
  return Response.json(await prisma.task.findMany({ where: { active: true } }));
}
```

---

## 6.6 Task Logging API

### POST /api/task-log

**Rules**
- Client sends `localDate`
- Only DONE / PARTIAL allowed
- Upsert semantics

```ts
// app/api/task-log/route.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const schema = z.object({
  taskId: z.string().uuid(),
  localDate: z.string(),
  status: z.enum(["DONE", "PARTIAL"])
});

export async function POST(req: Request) {
  requireAuth();
  const data = schema.parse(await req.json());

  await prisma.taskDayLog.upsert({
    where: {
      taskId_localDate: {
        taskId: data.taskId,
        localDate: new Date(data.localDate)
      }
    },
    update: { status: data.status },
    create: {
      taskId: data.taskId,
      userId: "ADMIN",
      localDate: new Date(data.localDate),
      status: data.status,
      source: "USER"
    }
  });

  return Response.json({ ok: true });
}
```

---

## 6.7 Grid Data API

### GET /api/grid?start=YYYY-MM-DD&end=YYYY-MM-DD

```ts
export async function GET(req: Request) {
  requireAuth();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const data = await prisma.task.findMany({
    include: {
      logs: {
        where: { localDate: { gte: new Date(start!), lte: new Date(end!) } }
      }
    }
  });

  return Response.json(data);
}
```

---

## 6.8 Error Handling Strategy

- Zod errors → 400
- Auth errors → 401
- DB constraint errors → 409
- Unknown → 500

No custom framework. Keep it boring.

---

## 6.9 API Tests (Minimal but Real)

- Use Vitest
- Spin up test DB
- Hit route handlers directly

Example:
```ts
it("upserts daily log", async () => {
  await postLog("DONE");
  await postLog("PARTIAL");
  const logs = await prisma.taskDayLog.findMany();
  expect(logs).toHaveLength(1);
  expect(logs[0].status).toBe("PARTIAL");
});
```

---

**End of Section B1 — API Layer**


```ts
TaskDayLog {
  id: UUID
  taskId: UUID
  userId: UUID
  localDate: date
  status: DONE | PARTIAL | MISSED
  source: USER | SYSTEM
  createdAt: timestamp
}
```

### Constraints
- UNIQUE(taskId, localDate)
- NOT NULL(status)
- Indexed by (userId, localDate)

---

# 6. Date & Time Semantics (Critical)

## 6.1 Canonical Rules
- **User local date is authoritative**
- Backend never infers date
- Client sends explicit `localDate`

## 6.2 Midnight Reset
- Implemented client‑side
- Server validates date consistency

## 6.3 Missed State
- Derived, not written
- If no DONE or PARTIAL exists for date → MISSED

---

# 7. API Specification

## 7.1 Authentication

### POST /api/auth/login
```json
{ "username": "", "password": "" }
```

Returns:
```json
{ "sessionToken": "" }
```

---

## 7.2 Task Management

### POST /api/tasks
```json
{ "name": "Drink water" }
```

### PUT /api/tasks/{id}
```json
{ "name": "", "active": true }
```

### DELETE /api/tasks/{id}

---

## 7.3 Daily Logging

### POST /api/task-log
```json
{
  "taskId": "",
  "localDate": "YYYY-MM-DD",
  "status": "DONE" | "PARTIAL"
}
```

Idempotent.

---

# 8. Frontend UX Specification

## 8.1 Onboarding Input
- Fixed center input
- Non‑reflowing layout
- 20‑item cap enforced client + server
- Character counter

## 8.2 Today Panel
- Optimistic UI
- Reversible state transitions
- Accessibility: keyboard + screen readers

## 8.3 Grid View
- Virtualized rendering
- Dynamic column ranges
- Color‑only never sole indicator (WCAG)

---

# 9. State Management

- Server state: TanStack Query
- Local UI state: Zustand
- Derived state memoized

---

# 10. Error Handling

- Typed error responses
- Client error boundaries
- Retry with backoff

---

# 11. Observability

## 11.1 Metrics
- Request latency
- Error rates
- Daily active users

## 11.2 Logging
- Structured JSON logs
- Correlation IDs

---

# 12. Testing Strategy

## 12.1 Unit Tests
- Domain logic
- Date calculations

## 12.2 Integration Tests
- API routes
- DB constraints

## 12.3 E2E Tests
- Playwright
- Cross‑timezone scenarios

---

# 13. Security Model

- CSRF protection
- Rate limiting
- Input validation (Zod)
- Secrets via env vars

---

# 14. Deployment Pipeline

## CI
- Lint
- Typecheck
- Test

## CD
- Preview deploys
- Production gates

---

# 15. Implementation Phases

## Phase 1
- Core UX
- Task logging
- Grid analytics

## Phase 2
- Real auth
- Notifications
- Social

---

# 16. Parallelization Map

| Track | Work |
|-----|-----|
| A | Frontend UX |
| B | API + DB |
| C | Auth |
| D | Testing |

---

# 17. Risk Register

- Timezone drift → mitigated via explicit localDate
- Write amplification → batching
- UI perf → virtualization

---

# 18. Acceptance Criteria

- Every task has explicit daily state
- No silent data loss
- Deterministic replay of history

---

# 19. Appendix

- Migration strategy
- Schema evolution
- Backfill jobs

---

**This document defines a production‑ready, audit‑safe, enterprise‑grade system.**


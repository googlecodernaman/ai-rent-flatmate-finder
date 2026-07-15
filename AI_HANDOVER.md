# AI_HANDOVER.md — Agent Quickstart Guide

> **Read this first.** Then read `RULES.md`. Then `PROJECT_STATE.md`.
> This document tells you exactly where to start and what not to break.

---

## What This Project Is

A **Rent & Flatmate Finder** platform backend. Owners post room listings. Tenants browse them, get AI-computed compatibility scores (via Google Gemini), express interest, and chat with owners once accepted.

This is a Node.js/Express REST API + Socket.IO backend only. No frontend.

---

## How to Run

```powershell
# Always run from backend directory
cd e:\nivasai\rent-flatmate-finder\backend

# Start server
node src/server.js

# Apply schema changes (use db push, NOT migrate)
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate
```

Server runs on `http://localhost:3000`. Health check: `GET /api/health`.

---

## Current State (as of 2026-07-15)

**Tasks 1–9 complete. Task 10 is next.**

```
✅ Task 1  — Scaffolding, env config, error handler
✅ Task 2  — Database schema (6 models, Neon PostgreSQL)
✅ Task 3  — Auth: register, login, JWT, RBAC middleware
✅ Task 4  — Tenant profile: POST/GET/PUT
✅ Task 5  — Listing CRUD: create, update, delete, fill + photo upload
✅ Task 6  — Listing browse + filter + pagination (tenant view)
✅ Task 7  — Scoring Engine: gemini.service.js + scoring.service.js (LLM + fallback)
✅ Task 8  — Batch scoring & invalidation wired into profile + listing services
✅ Task 9  — Compatibility API + browseListings score join + ranked sort
⏳ Task 10 — Interest request flow (PENDING→ACCEPTED→DECLINED) ← START HERE
⏳ Task 11 — Email notifications (Resend)
⏳ Task 12 — WebSocket chat (Socket.IO)
⏳ Task 13 — Admin API
⏳ Task 14 — Seed script
⏳ Task 15 — Polish & edge cases
```

---

## Critical Facts That Will Save You

### 1. Neon Database — Do NOT touch `lib/prisma.js`
`new PrismaClient()` with zero configuration is what works. Prisma 6.x auto-detects Neon and uses its HTTP driver. Any manual adapter (`@neondatabase/serverless`, `PrismaNeon`, `Pool`) will break it. This was confirmed after extensive debugging.

### 2. Always run server from `backend/` directory
`dotenv.config()` in `env.js` uses `process.cwd()` to find `.env`. If you run from the wrong directory, DATABASE_URL won't load.

### 3. Multer must run before Zod validation on multipart routes
On `POST /api/listings` (multipart), the middleware order is: `authenticate → requireRole → upload.array() → validate(schema) → controller`. If you swap multer and validate, the body is empty when Zod runs.

### 4. Score invalidation fields
`listing.service.js` tracks `MATERIAL_FIELDS = Set { 'rent', 'location', 'roomType', 'furnishingStatus' }`. When these change on update, `materialFieldChanged = true` is returned. `invalidateAndRescore()` is triggered fire-and-forget in `listing.service.js` — already wired.

### 5. Batch scoring is fire-and-forget
Never `await` batch scoring calls inside an HTTP request handler. Use `.catch(console.error)` to prevent unhandled rejections. Latency must stay under 200ms for the HTTP response.

### 6. Route order matters in listing.routes.js
`GET /api/listings/my` (OWNER) is registered BEFORE `GET /api/listings/:id` (TENANT). This is intentional — do not reorder them.

### 7. Neon TCP port 5432 is intermittently unreachable on this network
Stand-alone scripts (`node somefile.js`) that construct `PrismaClient` directly fail with `Can't reach database server at port 5432`. The application server works because Prisma's connection is warmed during the server process lifetime. **Do not run stand-alone Prisma scripts to verify DB state** — use the running server's API instead. This also means standalone seed scripts must be run with the server already warm, or via `npx prisma db seed` which reuses the Prisma engine process.

### 8. PowerShell test scripts with `Invoke-RestMethod` silently continue on errors
`$ErrorActionPreference = "Continue"` (default) means a script prints `✅ OK` even if every API call returned 401/404. Always check that tokens are non-empty and IDs are non-empty UUIDs before trusting test output.

---

## Files You'll Touch for Each Remaining Task

### ✅ Tasks 7–9 — Already done
All scoring, batch, and compatibility files are created and wired. Do NOT recreate them.
- `src/services/gemini.service.js` ✅
- `src/services/scoring.service.js` ✅
- `src/services/batchScoring.service.js` ✅
- `src/routes/compatibility.routes.js` ✅
- `src/controllers/compatibility.controller.js` ✅
- `src/services/tenantProfile.service.js` — batch triggers already wired ✅
- `src/services/listing.service.js` — batch triggers + score join already wired ✅
- `src/server.js` — `/api/compatibility` already mounted ✅

### Task 10 — Interest Flow ← NEXT
Create:
- `src/routes/interest.routes.js`
- `src/controllers/interest.controller.js`
- `src/services/interest.service.js`

Wire: `src/server.js` — mount `/api/interests`

### Task 11 — Email
Create: `src/services/email.service.js`  
Wire into: `src/services/scoring.service.js` (score≥threshold triggers owner email), `src/services/interest.service.js` (accepted status triggers tenant email)

### Task 12 — Chat
Create:
- `src/socket/chat.socket.js`
- `src/routes/chat.routes.js`
- `src/services/chat.service.js`

Wire: `src/server.js` — attach Socket.IO to the existing `httpServer` export

### Task 13 — Admin
Create:
- `src/routes/admin.routes.js`
- `src/controllers/admin.controller.js`

Wire: `src/server.js` — mount `/api/admin`

### Task 14 — Seed
Create: `prisma/seed.js`

### Task 15 — Polish
Modify: `src/server.js`, `src/middleware/errorHandler.js`, various routes

---

## Environment Variables

File: `e:\nivasai\rent-flatmate-finder\backend\.env`

```
DATABASE_URL=postgresql://neondb_owner:...@ep-curly-credit-aomx9f83-pooler...?sslmode=require&channel_binding=require
JWT_SECRET=dev-secret-do-not-use-in-production
GEMINI_API_KEY=                  ← Needed for Task 7 LLM path
RESEND_API_KEY=                  ← Needed for Task 11
EMAIL_FROM=onboarding@resend.dev
PORT=3000
NODE_ENV=development
SCORE_THRESHOLD=80
FRONTEND_URL=http://localhost:5173
```

If `GEMINI_API_KEY` is empty, scoring falls back to rule-based scorer automatically.  
If `RESEND_API_KEY` is empty, email service logs and returns silently.

---

## Key Decisions Already Made

| Decision | Choice | Reason |
|----------|--------|--------|
| DB driver | Standard PrismaClient | Prisma 6 auto-handles Neon HTTP |
| Photo storage | Local filesystem `/uploads/` | Simpler than S3 for assignment |
| Validation | Zod | Agreed in original session |
| Scoring strategy | Batch-then-lazy-fill | Per explicit user instruction |
| Score batch timing | Fire-and-forget async | Keep HTTP response fast |
| LLM fallback | Rule-based (budget 60% + location 40%) | Per assignment spec |
| Token expiry | 7d | Standard for dev/demo |

---

## Updating the Handover Docs

After completing each task, update:
1. `PROJECT_STATE.md` — mark task ✅, update file tree if new files added
2. `TEST_RESULTS.md` — add results for that task's verification
3. `AI_HANDOVER.md` — update "Current State" table above
4. `API_CONTRACT.md` — mark ⏳ endpoints as ✅ once implemented

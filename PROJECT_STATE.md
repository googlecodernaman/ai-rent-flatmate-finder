# PROJECT_STATE.md — Current Implementation State

> Last updated: 2026-07-15
> **Update this file every time a task is completed.**

---

## Overall Progress

**Tasks 1–9 of 15 complete.**

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Project Scaffolding & Configuration | ✅ Done | Express server, env validation, error handler |
| 2 | Database Schema & Migrations | ✅ Done | 6 models pushed to Neon |
| 3 | Authentication System | ✅ Done | JWT register/login/me, RBAC middleware |
| 4 | Tenant Profile CRUD | ✅ Done | POST/GET/PUT, 1-per-tenant enforced |
| 5 | Listing CRUD + Photo Upload | ✅ Done | Owner CRUD, multer, fill marker |
| 6 | Listing Browse, Filter & Detail | ✅ Done | Tenant browse + filter + pagination |
| 7 | Scoring Engine | ✅ Done | LLM (Gemini Flash) + rule-based fallback |
| 8 | Batch Scoring & Invalidation | ✅ Done | Fire-and-forget on profile/listing events |
| 9 | Compatibility API + Ranking | ✅ Done | `/api/compatibility/:listingId` + score join in browse |
| 10 | Interest Request Flow | ⏳ Next | PENDING→ACCEPTED→DECLINED |
| 11 | Email Notifications | ⏳ Not started | Resend, score≥threshold trigger |
| 12 | WebSocket Real-Time Chat | ⏳ Not started | Socket.IO, ACCEPTED-only |
| 13 | Admin API | ⏳ Not started | Stats, user management |
| 14 | Seed Script | ⏳ Not started | Demo data for evaluator |
| 15 | Backend Polish & Edge Cases | ⏳ Not started | Rate limiting, final cleanup |

---

## Directory Structure

```
e:\nivasai\rent-flatmate-finder\
├── RULES.md                          ← Read first
├── PROJECT_STATE.md                  ← This file
├── AI_HANDOVER.md                    ← Quickstart for new agent
├── TASKS.md                          ← Detailed task specs
├── API_CONTRACT.md                   ← All API endpoints
├── TEST_RESULTS.md                   ← Verified test results
├── 01_REQUIREMENTS.md
├── 02_BUILD_PLAN.md
├── 03_AGENT_RULES.md
└── backend/
    ├── .env                          ← Credentials (NOT committed)
    ├── .env.example                  ← Template
    ├── package.json
    ├── prisma/
    │   └── schema.prisma             ← Full DB schema
    ├── uploads/                      ← Photo storage (created at runtime)
    └── src/
        ├── server.js                 ← Entry point
        ├── config/
        │   ├── env.js                ← Env vars + validateEnv()
        │   └── constants.js          ← All magic numbers
        ├── lib/
        │   └── prisma.js             ← PrismaClient singleton
        ├── middleware/
        │   ├── auth.js               ← JWT verify → req.user
        │   ├── roles.js              ← requireRole(role)
        │   ├── validate.js           ← Zod schema validator
        │   ├── upload.js             ← Multer config
        │   └── errorHandler.js       ← AppError + global handler
        ├── routes/
        │   ├── auth.routes.js        ← ✅ /api/auth
        │   ├── tenantProfile.routes.js ← ✅ /api/tenant-profile
        │   ├── listing.routes.js     ← ✅ /api/listings
        │   └── compatibility.routes.js ← ✅ /api/compatibility
        ├── controllers/
        │   ├── auth.controller.js    ← ✅
        │   ├── tenantProfile.controller.js ← ✅
        │   ├── listing.controller.js ← ✅
        │   └── compatibility.controller.js ← ✅
        └── services/
            ├── auth.service.js           ← ✅
            ├── tenantProfile.service.js  ← ✅ (batch triggers wired)
            ├── listing.service.js        ← ✅ (browse + score join + batch triggers)
            ├── gemini.service.js         ← ✅ Gemini Flash LLM wrapper
            ├── scoring.service.js        ← ✅ computeAndPersistScore + fallback
            └── batchScoring.service.js   ← ✅ scoreAll* + invalidateAndRescore
```

---

## Database Models (all in Neon `neondb` schema `public`)

| Table | Model | Key Fields |
|-------|-------|------------|
| `users` | User | id, name, email, passwordHash, role |
| `tenant_profiles` | TenantProfile | userId (unique), preferredLocation, budgetMin, budgetMax, moveInDate |
| `listings` | Listing | ownerId, title, location, rent, roomType, furnishingStatus, photos[], isFilled |
| `compatibility_scores` | CompatibilityScore | tenantId, listingId (unique pair), score 0-100, explanation, isFallback |
| `interest_requests` | InterestRequest | tenantId, listingId, ownerId (unique pair), status PENDING/ACCEPTED/DECLINED |
| `chat_messages` | ChatMessage | interestId, senderId, content; indexed by (interestId, createdAt) |

---

## Active API Endpoints

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| GET | /api/health | No | — | ✅ |
| POST | /api/auth/register | No | — | ✅ |
| POST | /api/auth/login | No | — | ✅ |
| GET | /api/auth/me | JWT | Any | ✅ |
| POST | /api/tenant-profile | JWT | TENANT | ✅ |
| GET | /api/tenant-profile | JWT | TENANT | ✅ |
| PUT | /api/tenant-profile | JWT | TENANT | ✅ |
| POST | /api/listings | JWT | OWNER | ✅ |
| GET | /api/listings/my | JWT | OWNER | ✅ |
| PUT | /api/listings/:id | JWT | OWNER | ✅ |
| DELETE | /api/listings/:id | JWT | OWNER | ✅ |
| PATCH | /api/listings/:id/fill | JWT | OWNER | ✅ |
| GET | /api/listings | JWT | TENANT | ✅ + compatibilityScore join |
| GET | /api/listings/:id | JWT | TENANT | ✅ |
| GET | /api/compatibility/:listingId | JWT | TENANT | ✅ lazy-compute |

---

## Environment Variables

Required at runtime:

```
DATABASE_URL   — Neon pooler connection string (with sslmode=require&channel_binding=require)
JWT_SECRET     — JWT signing secret
```

Optional (features degrade gracefully if missing):

```
GEMINI_API_KEY — Required for LLM scoring (Task 7)
RESEND_API_KEY — Required for email notifications (Task 11)
EMAIL_FROM     — Sender address for emails
SCORE_THRESHOLD — Default 80. Email triggered when score >= this
PORT           — Default 3000
FRONTEND_URL   — Used for CORS in production
```

---

## Known Gotchas

1. **Neon + Prisma**: Use `new PrismaClient()` with NO adapter. Prisma 6.x auto-handles Neon HTTP. Do NOT add `@neondatabase/serverless` Pool manually.
2. **Server start**: Always run from `e:\nivasai\rent-flatmate-finder\backend\` directory (because `dotenv.config()` uses `process.cwd()`).
3. **Photo upload**: `multer` middleware must run BEFORE `validate()` middleware on multipart routes.
4. **Listing browse route conflict**: `GET /api/listings/my` (OWNER) must be registered BEFORE `GET /api/listings/:id` (TENANT). ✅ Already handled.
5. **Score invalidation**: `MATERIAL_FIELDS` in `listing.service.js`: `rent`, `location`, `roomType`, `furnishingStatus`. `invalidateAndRescore()` is already wired on listing update.
6. **Neon TCP port 5432 unreachable on this dev network**: Stand-alone `node script.js` Prisma calls fail with `Can't reach database server at port 5432`. The running application server works fine. **Do not use standalone scripts to verify DB state** — use the server API endpoints. Seed scripts should also go through `npx prisma db seed`.
7. **PowerShell `Invoke-RestMethod` silently continues on HTTP errors**: `$ErrorActionPreference = "Continue"` (the default) means scripts print success messages even when all calls returned 401/404. Always verify tokens and IDs are non-empty UUIDs before trusting output.

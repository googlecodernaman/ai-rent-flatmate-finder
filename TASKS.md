# TASKS.md — Detailed Task Specifications

> Derived from assignment PDF + architecture decisions.
> **Do not change task definitions without re-reading RULES.md.**

---

## Completed Tasks

### ✅ Task 1: Project Scaffolding & Configuration
- Express 5 server with helmet, cors, morgan, express.json
- `src/config/env.js` — dotenv loader + validateEnv() (fail-fast in production)
- `src/config/constants.js` — all magic numbers centralized
- `src/middleware/errorHandler.js` — AppError class + global error handler
- `src/lib/prisma.js` — PrismaClient singleton (global cache for dev hot-reload)
- `/api/health` endpoint
- `/uploads` static file serving

### ✅ Task 2: Database Schema & Migrations
- 6 models: User, TenantProfile, Listing, CompatibilityScore, InterestRequest, ChatMessage
- 4 enums: Role, RoomType, FurnishingStatus, InterestStatus
- Unique constraints: `(tenantId, listingId)` on CompatibilityScore and InterestRequest
- Index on ChatMessage `(interestId, createdAt)` for ordered chat retrieval
- Schema pushed to Neon via `npx prisma db push`

### ✅ Task 3: Authentication System
**Files:** `auth.routes.js`, `auth.controller.js`, `auth.service.js`, `auth.js`, `roles.js`, `validate.js`

| Endpoint | Behaviour |
|----------|-----------|
| POST /api/auth/register | Creates User. Role must be OWNER or TENANT (ADMIN blocked). Returns JWT + user object. |
| POST /api/auth/login | Validates password with bcrypt. Returns JWT + user object. |
| GET /api/auth/me | Requires valid JWT. Returns user data without passwordHash. |

- JWT contains `{ id, role }`. Expires in 7d.
- `authenticate` middleware: verifies JWT → sets `req.user = { id, role }`.
- `requireRole(role)` middleware: checks `req.user.role`. Returns 403 if mismatch.
- `validate(schema)` middleware: Zod parse → 400 with field errors on failure.

### ✅ Task 4: Tenant Profile CRUD
**Files:** `tenantProfile.routes.js`, `tenantProfile.controller.js`, `tenantProfile.service.js`

| Endpoint | Behaviour |
|----------|-----------|
| POST /api/tenant-profile | Creates profile. 409 if profile already exists. |
| GET /api/tenant-profile | Returns authenticated tenant's profile. 404 if none. |
| PUT /api/tenant-profile | Partial update. All fields optional. budgetMin ≤ budgetMax validated. |

- All routes: `authenticate + requireRole('TENANT')` applied at router level.
- Score invalidation on profile update is handled by Task 8 (not yet wired).

### ✅ Task 5: Listing CRUD + Photo Upload
**Files:** `listing.routes.js`, `listing.controller.js`, `listing.service.js`, `upload.js`

| Endpoint | Behaviour |
|----------|-----------|
| POST /api/listings | Creates listing. Photos via multipart `photos` field (up to 10). Returns listing. |
| GET /api/listings/my | Returns all listings owned by authenticated user. |
| PUT /api/listings/:id | Partial update. Ownership verified. New photos appended to array. |
| DELETE /api/listings/:id | Deletes listing. Cascades to interests/messages/scores via FK. |
| PATCH /api/listings/:id/fill | Sets `isFilled = true`. Room marked as taken. |

- `MATERIAL_FIELDS = { rent, location, roomType, furnishingStatus }` — changes flag `materialFieldChanged` for Task 8.

### ✅ Task 6: Listing Browse, Filter & Detail (Tenant)
**File:** Same `listing.service.js`, `listing.controller.js`, `listing.routes.js`

| Endpoint | Behaviour |
|----------|-----------|
| GET /api/listings | Browse active (`isFilled=false`) listings. Query params: `location`, `budgetMin`, `budgetMax`, `page`, `limit`. Returns `{ data, pagination }`. |
| GET /api/listings/:id | Full detail view with owner info. Returns 410 if listing is filled. |

- After Task 9 (Compatibility API), `GET /api/listings` includes `compatibilityScore` per listing, ranked by score descending. **✅ Done in Task 9.**

### ✅ Task 7: Scoring Engine (LLM + Fallback + Scorer)
**Files created:** `src/services/gemini.service.js`, `src/services/scoring.service.js`

**How it works:**
1. `computeAndPersistScore(tenantId, listingId)` — loads profile + listing, tries Gemini Flash LLM.
2. If LLM fails or `GEMINI_API_KEY` is unset → `computeFallbackScore(profile, listing)` is called.
3. Result is upserted into `CompatibilityScore` table on `(tenantId, listingId)` unique key.

**Fallback formula:** `Math.round(budgetScore * 0.6 + locationScore * 0.4)`
- Budget: rent in `[budgetMin, budgetMax]` → 100, else 0.
- Location: case-insensitive substring match (either direction) → 100, else 0.
- `isFallback = true` on fallback rows.

**Gemini config:** `gemini-1.5-flash`, `responseMimeType: 'application/json'`, max 200 tokens, temp 0.2.

**Exported:** `computeAndPersistScore`, `computeFallbackScore`, `getPersistedScore`

### ✅ Task 8: Batch Scoring & Score Invalidation
**File created:** `src/services/batchScoring.service.js`

**Triggers (all fire-and-forget via `.catch(console.error)`):**
| Event | Call |
|-------|------|
| Tenant profile created | `scoreAllListingsForTenant(userId)` |
| Tenant profile updated | `scoreAllListingsForTenant(userId)` |
| New listing created | `scoreAllTenantsForListing(listingId)` |
| Listing material field changed | `invalidateAndRescore(listingId)` |

All triggers are already wired in `tenantProfile.service.js` and `listing.service.js`.

**Rate limiting:** `BATCH_SCORE_DELAY_MS = 4000` between sequential Gemini calls.

### ✅ Task 9: Compatibility API + Listing Ranking
**Files created:** `src/routes/compatibility.routes.js`, `src/controllers/compatibility.controller.js`

| Endpoint | Behaviour |
|----------|-----------|
| GET /api/compatibility/:listingId | Returns persisted score; lazy-computes if missing. Requires tenant profile to exist. |

**Retrofit to `browseListings()`:** Accepts `tenantId` param. Joins `CompatibilityScore` rows for that tenant. Sorts: scored desc first, then unscored. Attaches `compatibilityScore` and `scoreFallback` to each listing object.

---

## Pending Tasks

### ⏳ Task 7: Scoring Engine (LLM + Fallback + Scorer)
**New files to create:**
- `src/services/scoring.service.js`
- `src/services/gemini.service.js`

**Logic:**
```
computeScore(tenantProfile, listing) → { score: 0-100, explanation: string, isFallback: bool }
```

1. Try LLM (Gemini Flash):
   - Build a structured prompt with tenant preferences and listing details.
   - Parse response: `{ score: number, explanation: string }`.
   - Validate score is 0–100 integer.
   - On any LLM error (timeout, parse fail, API error) → fall back silently.

2. If LLM unavailable/fails → Rule-based fallback:
   - Budget score: tenant's budget range overlaps listing rent → 100, else 0.
   - Location score: case-insensitive substring match → 100, else 0.
   - `finalScore = (budgetScore * 0.6) + (locationScore * 0.4)`.
   - `isFallback = true`.

3. Persist to `CompatibilityScore` table:
   - `upsert` on `(tenantId, listingId)` — never duplicate.

**Gemini prompt guidelines:**
- System: "You are evaluating apartment compatibility. Respond ONLY with valid JSON: { \"score\": <0-100 integer>, \"explanation\": \"<2 sentences max>\" }"
- User: tenant profile + listing in structured format.
- Max output tokens: 200.

---

### ⏳ Task 8: Batch Scoring & Score Invalidation
**New file:** `src/services/batchScoring.service.js`

**Triggers:**
| Event | Action |
|-------|--------|
| Tenant profile created | Compute scores for ALL active listings |
| Tenant profile updated | Recompute scores for ALL active listings |
| New listing created | Compute scores for ALL tenants with profiles |
| Listing material field updated | Delete existing scores for that listing; recompute for all tenants |

**Rate limiting:** 4-second delay between Gemini calls (`BATCH_SCORE_DELAY_MS = 4000`). Use sequential processing, not Promise.all.

**Wiring:** 
- In `tenantProfile.service.js` createProfile/updateProfile: call `batchScoring.scoreAllListingsForTenant(tenantId)` after profile save.
- In `listing.service.js` createListing: call `batchScoring.scoreAllTenantsForListing(listingId)` after listing save.
- In `listing.service.js` updateListing: if `materialFieldChanged`, call `batchScoring.invalidateAndRescore(listingId)`.
- All batch calls are fire-and-forget (don't await in the HTTP request cycle — use `.catch(console.error)`).

---

### ⏳ Task 9: Compatibility API + Listing Ranking
**New files:** `src/routes/compatibility.routes.js`, `src/controllers/compatibility.controller.js`

**Endpoints:**

| Method | Path | Auth | Role | Behaviour |
|--------|------|------|------|-----------|
| GET | /api/compatibility/:listingId | JWT | TENANT | Returns score for this tenant+listing. Lazy-computes if missing. |
| GET | /api/listings (retrofit) | JWT | TENANT | Add `compatibilityScore` to each listing item; sort by score desc. |

**For the GET /api/listings retrofit:**
- Join scores for the authenticated tenant.
- Listings without a score yet show `compatibilityScore: null`.
- Sort: listings with score first (desc), then unscored.

---

## Pending Tasks

### ⏳ Task 10: Interest Request Flow ← NEXT
**New files:** `src/routes/interest.routes.js`, `src/controllers/interest.controller.js`, `src/services/interest.service.js`

| Method | Path | Auth | Role | Behaviour |
|--------|------|------|------|-----------|
| POST | /api/interests | JWT | TENANT | Express interest. Creates InterestRequest PENDING. 409 if already expressed. |
| GET | /api/interests | JWT | TENANT | List own sent interests with status. |
| GET | /api/interests/received | JWT | OWNER | List interests on own listings. Includes tenant info + score. |
| PATCH | /api/interests/:id/accept | JWT | OWNER | Sets status=ACCEPTED. Triggers email notification (Task 11). |
| PATCH | /api/interests/:id/decline | JWT | OWNER | Sets status=DECLINED. |

---

### ⏳ Task 11: Email Notifications
**New file:** `src/services/email.service.js`

Triggers:
1. **Score threshold**: When `score >= SCORE_THRESHOLD`, email the **owner** of the listing: "Tenant X is highly compatible (score: Y)".
2. **Interest accepted**: Email the **tenant** when owner accepts: "Your interest in [listing] has been accepted".

Use Resend API. If `RESEND_API_KEY` is empty → log and return silently (graceful fallback).

---

### ⏳ Task 12: WebSocket Real-Time Chat
**New files:** `src/socket/chat.socket.js`, `src/routes/chat.routes.js`, `src/services/chat.service.js`

- Attach Socket.IO to `httpServer` exported from `server.js`.
- Auth: socket handshake sends JWT in `auth.token` — verify with same `authenticate` logic.
- Room: `interestId` — both tenant and owner join same room.
- Gate: only `ACCEPTED` interest requests allow chat. Return error if not accepted.
- Events: `join_room`, `send_message`, `receive_message`, `error`.
- Persist every message to `ChatMessage` table.
- REST endpoint: `GET /api/chats/:interestId` — fetch message history (paginated).

---

### ⏳ Task 13: Admin API
**New files:** `src/routes/admin.routes.js`, `src/controllers/admin.controller.js`

All routes require `ADMIN` role.

| Method | Path | Behaviour |
|--------|------|-----------|
| GET | /api/admin/stats | Total users, listings, interests, scores |
| GET | /api/admin/users | List all users (paginated) |
| DELETE | /api/admin/users/:id | Delete user + cascade |
| GET | /api/admin/listings | List all listings (paginated) |

---

### ⏳ Task 14: Seed Script
**New file:** `prisma/seed.js`

Creates:
- 1 ADMIN user
- 3 OWNER users
- 5 TENANT users (each with a profile)
- 8–10 listings (varied locations, rents, room types)
- Compatibility scores for all tenant-listing pairs
- 3–5 interest requests (mix of statuses)
- Sample chat messages for ACCEPTED interests

Run with: `npx prisma db seed` (after adding `"prisma": { "seed": "node prisma/seed.js" }` to `package.json`).

> ⚠️ **Do NOT run as a plain `node prisma/seed.js`** — Neon TCP port 5432 is unreachable on this dev network from standalone Node processes. Use `npx prisma db seed` which reuses the Prisma engine's HTTP connection.

---

### ⏳ Task 15: Backend Polish & Edge Cases
- Rate limiting: `express-rate-limit` on auth routes (10 req/min per IP).
- Request size limit: 10 MB for JSON, 50 MB for multipart (photos).
- Final check: all routes return consistent error shapes `{ error: { message, code } }`.
- Ensure `uploads/` directory is created on startup if it doesn't exist.
- Final `prisma db push` to confirm schema is in sync.
- Review all TODOs and comments in code.
- Confirm `httpServer` export is correct for Socket.IO integration.

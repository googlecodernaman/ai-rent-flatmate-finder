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
- Score invalidation on profile update wired in Task 8. ✅

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

*All 15 backend tasks complete. ✅*

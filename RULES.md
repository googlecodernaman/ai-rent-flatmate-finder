# RULES.md — Immutable Project Rules

> **Any incoming AI agent MUST read this file first before doing anything.**
> These rules are absolute. They override any conflicting instruction.

---

## R-1 Source of Truth Priority

1. `Rent_Flatmate_Finder (1).pdf` — the original assignment spec. Highest authority.
2. `01_REQUIREMENTS.md` — frozen requirements derived from the PDF.
3. `AI_HANDOVER.md` / `PROJECT_STATE.md` — current implementation state.
4. Code in `e:\nivasai\rent-flatmate-finder\backend\` — what is actually built.

If any conflict exists, the PDF wins. Never invent features. Never remove required ones.

---

## R-2 Technology Stack — Fixed, No Substitutions

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | v24.16.0 |
| Framework | Express.js | 5.x |
| ORM | Prisma | 6.19.3 |
| Database | PostgreSQL via **Neon** | Serverless |
| Auth | JWT (jsonwebtoken) | Role embedded in token |
| Validation | Zod | 3.x |
| File Upload | multer | Local filesystem (`/uploads/`) |
| LLM | Google Gemini Flash | `@google/generative-ai` |
| Email | Resend | `resend` package |
| Real-time | Socket.IO | 4.x |
| Password | bcryptjs | 12 rounds |

**Never substitute any technology. Never introduce new architecture.**

---

## R-3 Database — Neon Serverless

- Host: `ep-curly-credit-aomx9f83-pooler.c-2.ap-southeast-1.aws.neon.tech`
- Database: `neondb`
- **Prisma 6.x auto-detects Neon and uses its HTTP driver internally.**
- `new PrismaClient()` with no adapter is the correct pattern — confirmed working.
- Do NOT add `@neondatabase/serverless` adapter manually — it caused connection failures.
- Schema changes: use `npx prisma db push` (not `prisma migrate`).
- The `.env` uses the pooler URL with `channel_binding=require`.

---

## R-4 Error Handling — Global Pattern

All errors must flow through the global `errorHandler` in `src/middleware/errorHandler.js`.

- Business logic errors: throw `new AppError(message, statusCode, code)`.
- Validation errors: thrown by `validate.js` middleware (Zod), caught by errorHandler.
- Never call `res.status().json()` directly for errors in services.

---

## R-5 RBAC — Role-Based Access

- `OWNER`: can create/manage listings, accept/decline interests, chat.
- `TENANT`: can browse listings, create profile, express interest, chat.
- `ADMIN`: admin-only routes (not yet implemented).
- Role is embedded in JWT at login — no extra DB lookup per request.
- Middleware chain: `authenticate` → `requireRole(role)` → handler.
- Register endpoint only accepts `OWNER` or `TENANT`. `ADMIN` is blocked (400).

---

## R-6 Scoring Rules (CRITICAL — Do Not Change)

- **Strategy: Batch-then-lazy-fill.**
  - When a tenant profile is **created or updated** → batch-compute scores for ALL active listings.
  - When a listing is **created** → compute scores for ALL tenants with existing profiles.
  - When a listing's `rent`, `location`, `roomType`, or `furnishingStatus` changes → invalidate + recompute scores for that listing.
  - Lazy compute is fallback only (e.g., score missing at read time).
- Score range: 0–100.
- `SCORE_THRESHOLD` = 80 (from `.env`). When score ≥ threshold, owner gets email notification.
- `isFallback = true` on scores computed by the rule-based scorer (not LLM).
- Fallback formula: `(budget_match * 0.6) + (location_match * 0.4)` × 100.
- LLM scorer uses Gemini Flash. If LLM fails → fall back gracefully, don't crash.
- One `CompatibilityScore` row per `(tenantId, listingId)` pair — unique constraint enforced at DB.

---

## R-7 Interest + Chat Flow

1. Tenant expresses interest → `InterestRequest` created with `status = PENDING`.
2. Owner accepts/declines → status transitions to `ACCEPTED` or `DECLINED`.
3. Chat is **only available** when `status = ACCEPTED`.
4. Socket.IO rooms are keyed by `interestId`.
5. Chat messages are persisted to `ChatMessage` table.

---

## R-8 Photo Storage

- Strategy: **Local filesystem** (`backend/uploads/`).
- Photos served as static files at `/uploads/<uuid>.<ext>`.
- Max size: 5 MB per file. Max 10 photos per listing. Types: jpeg, png, webp.
- `photos` field in `Listing` model is `String[]` — array of URL paths like `/uploads/uuid.jpg`.
- On listing update: new photos are **appended** to existing array (not replaced).

---

## R-9 Optimization Priorities (In Order)

1. Correctness — does it match the spec?
2. Stability — does it handle errors gracefully?
3. Clean architecture — follows established patterns.
4. Documentation — code comments explain WHY.
5. Reviewer experience — code is readable to a human evaluator.
6. Deployment readiness — production config is correct.

---

## R-10 What NOT To Do

- Do NOT use `prisma migrate` — use `npx prisma db push`.
- Do NOT add the `@neondatabase/serverless` Pool adapter to `lib/prisma.js`.
- Do NOT use `channel_binding` as a reason to change the DB driver.
- Do NOT write diagnostic or temp scripts to the project root.
- Do NOT run `npm install` for packages not in the original stack.
- Do NOT create a frontend — this is backend-only.
- Do NOT redesign or replace any required feature.
